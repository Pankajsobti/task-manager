import cron from 'node-cron';
import { Resend } from 'resend';
import Task from '../models/Task.js';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Find tasks due within the next 24 hours that are not "done",
 * and email the assigned user a reminder.
 */
export const sendDueTaskReminders = async () => {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: in24Hours },
      status: { $ne: 'done' },
    }).populate('assignedTo', 'email name');

    if (!tasks.length) {
      console.log(`[emailReminder] No tasks due in next 24h at ${now.toISOString()}`);
      return;
    }

    console.log(`[emailReminder] Found ${tasks.length} task(s) due within 24h. Sending reminders...`);

    for (const task of tasks) {
      const user = task.assignedTo;

      if (!user || !user.email) {
        console.warn(`[emailReminder] Skipping task "${task.title}" (${task._id}) — no assigned user/email.`);
        continue;
      }

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: user.email,
          subject: `Reminder: "${task.title}" is due soon`,
          html: `
            <div style="font-family: sans-serif; line-height: 1.5;">
              <h2>Task Due Reminder</h2>
              <p>Hi ${user.name || 'there'},</p>
              <p>Your task <strong>${task.title}</strong> is due within the next 24 hours.</p>
              <ul>
                <li><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleString()}</li>
                <li><strong>Status:</strong> ${task.status}</li>
                <li><strong>Priority:</strong> ${task.priority}</li>
              </ul>
              <p>Please make sure to complete it on time.</p>
            </div>
          `,
        });

        console.log(`[emailReminder] Reminder sent to ${user.email} for task "${task.title}"`);
      } catch (sendErr) {
        console.error(`[emailReminder] Failed to send email for task ${task._id}:`, sendErr.message);
      }
    }
  } catch (err) {
    console.error('[emailReminder] Error while checking due tasks:', err.message);
  }
};

/**
 * Starts the daily cron job at 9:00 AM server time.
 */
export const startEmailReminderCron = () => {
  cron.schedule('0 9 * * *', () => {
    console.log('[emailReminder] Running scheduled 9AM due-task check...');
    sendDueTaskReminders();
  });

  console.log('[emailReminder] Cron job scheduled: daily at 9:00 AM');
};