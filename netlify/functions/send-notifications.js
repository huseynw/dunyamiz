const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const START_DATE = '2025-08-03T00:00:00Z';
const REMINDER_HOURS = [3, 2, 1];
const ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID;
const ONE_SIGNAL_API_KEY = process.env.ONE_SIGNAL_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

// Test üçün sabit player ID'leri (sizin verdiyiniz)
const TEST_PLAYER_IDS = [
    '5f14228d-24e3-4bd8-b219-1a317bce7a88',
    '32643469-8969-44f7-8ec7-222f2913ca44'
];

async function sendOneSignalNotification(title, message, subscriptionIds = null) {
    if (!ONE_SIGNAL_APP_ID || !ONE_SIGNAL_API_KEY) {
        console.error('OneSignal keylər yoxdur');
        return false;
    }
    try {
        const payload = {
            app_id: ONE_SIGNAL_APP_ID,
            headings: { en: title },
            contents: { en: message }
        };
        if (subscriptionIds && subscriptionIds.length) {
            payload.include_subscription_ids = subscriptionIds;
        } else {
            payload.included_segments = ['Subscribed Users'];
        }
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ONE_SIGNAL_API_KEY}`
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log('OneSignal cavabı:', data);
        return response.ok;
    } catch (e) {
        console.error('OneSignal xətası:', e);
        return false;
    }
}

async function shouldSend(type, identifier, supabase) {
    const now = new Date();
    if (type === 'hourly_reminder') {
        const { data } = await supabase
            .from('notification_log')
            .select('id')
            .eq('type', `reminder_${identifier}`)
            .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        return !data || data.length === 0;
    } else if (type === 'daily_love') {
        const today = now.toISOString().split('T')[0];
        const { data } = await supabase
            .from('notification_log')
            .select('id')
            .eq('type', 'daily_love')
            .gte('sent_at', `${today}T00:00:00Z`);
        return !data || data.length === 0;
    }
    return true;
}

async function logNotification(type, identifier, supabase) {
    const notificationType = type === 'hourly_reminder' ? `reminder_${identifier}` : type;
    await supabase.from('notification_log').insert({ type: notificationType, sent_at: new Date().toISOString() });
}

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        if (body.secret !== CRON_SECRET) {
            console.error('CRON_SECRET uyğunsuz');
            return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        // ========= TEST BİLDİRİŞİ (MÜVƏQQƏTİ) – birbaşa 2 cihaza =========
        if (TEST_PLAYER_IDS.length) {
            await sendOneSignalNotification('🔔 Test bildirişi', 'Bu funksiya işləyir! Cəmalə, səni sevirəm 💖', TEST_PLAYER_IDS);
        }
        // ===============================================================

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        const now = new Date();

        const { data: settings } = await supabase
            .from('site_settings')
            .select('next_meeting_date')
            .eq('id', 1)
            .single();
        if (!settings) throw new Error('No site_settings');

        const meetingDate = new Date(settings.next_meeting_date);
        const hoursUntil = Math.floor((meetingDate - now) / (1000 * 60 * 60));
        console.log(`Görüşə qalan saat: ${hoursUntil}`);

        if (hoursUntil > 0 && REMINDER_HOURS.includes(hoursUntil)) {
            if (await shouldSend('hourly_reminder', `${hoursUntil}h`, supabase)) {
                const success = await sendOneSignalNotification(`💖 Görüşümüzə ${hoursUntil} saat qaldı!`, `Səni görmək üçün saniyələr sayılır, Cəmaləm ❤️`);
                if (success) await logNotification('hourly_reminder', `${hoursUntil}h`, supabase);
                else console.error('Xatırlatma göndərilmədi');
            }
        }

        const start = new Date(START_DATE);
        const daysTogether = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        console.log(`Birlikdə ${daysTogether} gün`);
        
        if (await shouldSend('daily_love', null, supabase)) {
            const success = await sendOneSignalNotification(`✨ ${daysTogether}. günümüz!`, `Birlikdə olduğumuz ${daysTogether}. gün. Səni hər gün daha çox sevirəm, Cəmaləm 🤍`);
            if (success) await logNotification('daily_love', null, supabase);
            else console.error('Günlük sevgi mesajı göndərilmədi');
        }

        return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (err) {
        console.error('Funksiya xətası:', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
