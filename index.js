const { App } = require('@slack/bolt');

const app = new App({
  token: process.env['SLACK_BOT_TOKEN'],
  signingSecret: process.env['SLACK_SIGNING_SECRET'],
  socketMode: true, 
  appToken: process.env['SLACK_APP_TOKEN'],
  port: process.env.PORT || 3000
});

app.command('/new-request', async ({ ack, body, client, logger }) => {
  // Acknowledge the command request
  await ack();

  try {
    // Call views.open with the built-in client
    const result = await client.views.open({
      // Pass a valid trigger_id within 3 seconds of receiving it
      trigger_id: body.trigger_id,
      // View payload
      view: {
        type: 'modal',
        // View identifier
        callback_id: 'view_1',
        title: {
          type: 'plain_text',
          text: 'Marketing Request Bot'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Welcome! Fill out the form below or tag Khloe or Juan for help!'
            }
          },
          {
            type: 'input',
            block_id: 'task_required',
            label: {
              type: 'plain_text',
              text: 'What task do you need help with?'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'task_input',
              multiline: true
            }
          }
        ],
        submit: {
          type: 'plain_text',
          text: 'Submit'
        }
      }
    });
  }
  catch (error) {
    logger.error(error);
  }
});

(async () => {
  await app.start();

  console.log('⚡️ Bolt app is running!');
})();