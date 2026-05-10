const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const START_DATE = '2025-08-03T00:00:00Z';
const REMINDER_HOURS = [3, 2, 1];
const ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID;
const ONE_SIGNAL_API_KEY = process.env.ONE_SIGNAL_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

async function sendOneSignalNotification(title, message) {
    if (!ONE_SIGNAL_APP_ID || !ONE_SIGNAL_API_KEY) return false;
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${ONE_SIGNAL_API_KEY}` },
        body: JSON.stringify({
            app_id: ONE_SIGNAL_APP_ID,
            headings: { en: title },
            contents: { en: message },
            included_segments: ['Subscribed Users']
        })
    });
    return response.ok;
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
            return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        const now = new Date();

        // get next meeting date
        const { data: settings } = await supabase
            .from('site_settings')
            .select('next_meeting_date')
            .eq('id', 1)
            .single();
        if (!settings) throw new Error('No site_settings');

        const meetingDate = new Date(settings.next_meeting_date);
        const hoursUntil = Math.floor((meetingDate - now) / (1000 * 60 * 60));

        // reminder for meeting
        if (hoursUntil > 0 && REMINDER_HOURS.includes(hoursUntil)) {
            if (await shouldSend('hourly_reminder', `${hoursUntil}h`, supabase)) {
                await sendOneSignalNotification(`💖 Görüşümüzə ${hoursUntil} saat qaldı!`, `Səni görmək üçün saniyələr sayılır, Cəmaləm ❤️`);
                await logNotification('hourly_reminder', `${hoursUntil}h`, supabase);
            }
        }

        // daily love message
        const start = new Date(START_DATE);
        const daysTogether = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        if (await shouldSend('daily_love', null, supabase)) {
            await sendOneSignalNotification(`✨ ${daysTogether}. günümüz!`, `Birlikdə olduğumuz ${daysTogether}. gün. Səni hər gün daha çox sevirəm, Cəmaləm 🤍`);
            await logNotification('daily_love', null, supabase);
        }

        return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (err) {
        console.error(err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
