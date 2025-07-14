const jwt = require('jsonwebtoken');
const axios = require("axios");
const fs = require('fs');
var crypto = require("crypto");


let safeCompare = (a, b) => {
    if (a.length !== b.length) {
        return false;
    }
    return crypto.timingSafeEqual(a, b);
};


/**
 * Validate request
 * @param {Object} body - Request Body
 * @param {string} signature - value of X-WORKS-Signature header
 * @param  {string} botSecret - Bot Secret
 * @return {boolean} is valid
 */
let validateRequest = (body, signature, botSecret) => {
    return safeCompare(
        crypto.createHmac("SHA256", botSecret).update(body).digest(),
        Buffer.from(signature, "base64"),
    );
};

/**
 * Generate JWT for access token
 * @param {string} clientId - Client ID
 * @param {string} serviceAccount - Service Account
 * @param {string} privatekey - Private Key
 * @return {string} JWT
 */
let getJWT = (clientId, serviceAccount, privatekey) => {
    console.log('[DEBUG] getJWT: privatekey start');
    console.log(privatekey);
    console.log('[DEBUG] getJWT: privatekey end');
    current_time = Date.now() / 1000;
    iss = clientId;
    sub = serviceAccount;
    iat = current_time;
    exp = current_time + (60 * 60); // 1 hour

    jws = jwt.sign(
        {
            "iss": iss,
            "sub": sub,
            "iat": iat,
            "exp": exp
        }, privatekey, {algorithm: "RS256"});

    return jws;
};


/**
 * Get Access Token
 * @async
 * @param {string} clientId - Client ID
 * @param {string} clientSecret - Client Secret
 * @param {string} serviceAccount - Service Account
 * @param {string} privatekeyPath - Private Key Path
 * @param {string} scope - OAuth Scope
 * @return {string} Access Token
 */
let getAccessToken = async (clientId, clientSecret, serviceAccount, privatekeyPath, scope) => {
    const privatekey = fs.readFileSync(privatekeyPath, 'utf8');
    const jwtToken = getJWT(clientId, serviceAccount, privatekey);

    const params = new URLSearchParams({
        assertion: jwtToken,
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        client_id: clientId,
        client_secret: clientSecret,
        scope: scope,
    });

    const res = await axios.post("https://auth.worksmobile.com/oauth2/v2.0/token", params);
    const accessToken = res.data.access_token;
    return accessToken;
};


/**
 * Send message to a user
 * @async
 * @param {Object} content - Message Content
 * @param {string} botId - Bot ID
 * @param {string} userId - User ID
 * @param {string} accessToken - Access Token
 * @return {Object} response
 */
let sendMessageToUser = async (content, botId, userId, accessToken) => {
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    };

    const res = await axios.post(`https://www.worksapis.com/v1.0/bots/${botId}/users/${userId}/messages`, content,
        { headers }
    );
    return res;
};

/**
 * 拠点IDごとに.envからユーザーIDを取得し、そのユーザーだけに通知
 * @param {string} locationId - 拠点ID
 * @param {string} message - 送信メッセージ
 * @return {Object} response
 */
let sendNotificationToLocation = async (locationId, message) => {
    try {
        const clientId = process.env.LW_API_CLIENT_ID;
        const clientSecret = process.env.LW_API_CLIENT_SECRET;
        const serviceAccount = process.env.LW_API_SERVICE_ACCOUNT;
        const privatekeyPath = process.env.LW_API_PRIVATEKEY_PATH;
        const botId = process.env.LW_API_BOT_ID;
        const scope = "bot";
        const envKey = `LW_ADMIN_USER_ID_${locationId}`;
        const userId = process.env[envKey];
        // デバッグ用ログ
        console.log('[DEBUG] sendNotificationToLocation');
        console.log('  locationId:', locationId);
        console.log('  envKey:', envKey);
        console.log('  userId:', userId);
        console.log('  message:', message);
        console.log('  LINE WORKS config:', {
          clientId,
          clientSecret: !!clientSecret,
          serviceAccount,
          privatekeyPath,
          botId
        });
        if (!userId) {
            console.error(`[ERROR] 環境変数 ${envKey} が設定されていません。`);
            return null;
        }
        if (!clientId || !clientSecret || !serviceAccount || !privatekeyPath || !botId) {
            console.error('[ERROR] LINE WORKS設定が不完全です');
            return null;
        }
        const accessToken = await getAccessToken(clientId, clientSecret, serviceAccount, privatekeyPath, scope);
        // LINE WORKS APIの正しいメッセージ形式
        const content = { 
            content: {
                type: "text",
                text: message
            }
        };
        console.log('[DEBUG] 送信するメッセージ形式:', JSON.stringify(content, null, 2));
        const result = await sendMessageToUser(content, botId, userId, accessToken);
        console.log(`[INFO] 通知を送信: locationId=${locationId}, userId=${userId}`);
        return result;
    } catch (error) {
        console.error('[ERROR] 通知送信エラー:', error);
        return null;
    }
};

/**
 * Send order notification to all configured users
 * @async
 * @param {Object} order - Order object
 * @param {Object} models - Sequelize models
 * @return {Object} response
 */
let sendOrderNotification = async (order, models) => {
    try {
        // 注文情報を取得
        const orderWithDetails = await models.Order.findOne({
            where: { id: order.id },
            include: [
                {
                    model: models.User,
                    as: 'customer',
                    attributes: ['displayName']
                },
                {
                    model: models.Vehicle,
                    as: 'vehicle',
                    attributes: ['id', 'typeNumber', 'licensePlate', 'frameNumber']
                },
                {
                    model: models.Location,
                    as: 'location',
                    attributes: ['name']
                }
            ]
        });

        if (!orderWithDetails) {
            console.log(`Order ${order.id} not found`);
            return null;
        }

        const customerName = orderWithDetails.customer?.displayName || '不明';
        // 車両欄は必ず車台番号（frameNumber）を表示
        const vehicleInfo = orderWithDetails.vehicle?.frameNumber || '不明';
        const locationName = orderWithDetails.location?.name || order.locationId;
        const orderDate = new Date(order.orderDate).toLocaleDateString('ja-JP');
        const remarks = orderWithDetails.remarks || '';

        // 注文内容を個別フィールドから取得
        let orderItemsText = '';
        const orderItems = [];
        
        if (order.diskPad && order.diskPad.trim() !== '') orderItems.push(`ディスクパッド: ${order.diskPad}`);
        if (order.brakeShoe && order.brakeShoe.trim() !== '') orderItems.push(`ブレーキシュー: ${order.brakeShoe}`);
        if (order.wiper && order.wiper.trim() !== '') orderItems.push(`ワイパー: ${order.wiper}`);
        if (order.belt && order.belt.trim() !== '') orderItems.push(`ベルト: ${order.belt}`);
        if (order.cleanFilter && order.cleanFilter.trim() !== '') orderItems.push(`クリンフィルター: ${order.cleanFilter}`);
        if (order.airElement && order.airElement.trim() !== '') orderItems.push(`エアエレメント: ${order.airElement}`);
        if (order.oilElement && order.oilElement.trim() !== '') orderItems.push(`オイルエレメント: ${order.oilElement}`);
        
        if (orderItems.length > 0) {
            orderItemsText = '\n📦 注文内容:\n';
            orderItems.forEach(item => {
                orderItemsText += `• ${item}\n`;
            });
        }

        // 備考欄を必ず注文内容の下に表示
        const remarksText = `\n📝 備考: ${remarks ? remarks : '（なし）'}`;

        const message = `📋 新規注文が登録されました\n\n🏢 拠点: ${locationName}\n👤 顧客: ${customerName}\n🚗 車両: ${vehicleInfo}\n📅 注文日: ${orderDate}\n🆔 注文ID: ${order.id}${orderItemsText}${remarksText}`;

        return await sendNotificationToLocation(order.locationId, message);

    } catch (error) {
        console.error('注文通知送信エラー:', error);
        return null;
    }
};

/**
 * Send test notification to all configured users
 * @async
 * @return {Object} response
 */
let sendTestNotification = async (locationId) => {
    try {
        const message = `🧪 通知テスト\n\n🏢 拠点: ${locationId}\n📅 送信日時: ${new Date().toLocaleString('ja-JP')}\n\nこのメッセージは通知機能のテストです。`;
        return await sendNotificationToLocation(locationId, message);
    } catch (error) {
        console.error('テスト通知送信エラー:', error);
        return null;
    }
};


module.exports = {
    validateRequest,
    getAccessToken,
    sendMessageToUser,
    sendNotificationToLocation,
    sendOrderNotification,
    sendTestNotification
};
