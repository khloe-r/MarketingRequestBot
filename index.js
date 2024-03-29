const { App } = require('@slack/bolt');
const Sequelize = require("sequelize-cockroachdb");
const http = require("http");

http.createServer((_, res) => res.end("Alive")).listen(3000)

const connectionString = process.env['DATABASE_URL']
const sequelize = new Sequelize(connectionString)

const app = new App({
  token: process.env['SLACK_BOT_TOKEN'],
  signingSecret: process.env['SLACK_SIGNING_SECRET'],
  socketMode: true,
  appToken: process.env['SLACK_APP_TOKEN'],
});

const Tasks = sequelize.define("tasks", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  info: {
    type: Sequelize.TEXT,
  },
  task: {
    type: Sequelize.TEXT,
  },
  responsible: {
    type: Sequelize.TEXT,
  },
  deadline: {
    type: Sequelize.DATEONLY,
  },
});

app.command('/view-tasks', async ({ ack, client }) => {
  await ack();
  const task_report = [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Open Tasks",
        "emoji": true
      }
    }
  ];

  await Tasks.findAll().then(function(tasks) {
    if (tasks.length === 0) {
      task_report.push({
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `No tasks open right now.\nGreat job team!\n`
        }
      })
    }
    tasks.forEach(function(task) {
      console.log(task.id + " " + task.task);
      task_report.push({
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Task for <@${task.responsible}>*: ${task.task} \n *Due:* ${task.deadline} \n`
        }
      })
      task_report.push(
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "emoji": true,
                "text": `Complete Task #${task.responsible}`
              },
              "style": "primary",
              "value": task.id,
              "action_id": "complete_v2"
            }
          ]
        })
    });
  })
    .catch(function(err) {
      console.error("error: " + err.message);
    });

  const today = new Date();
  const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
  task_report.push({
    "type": "context",
    "elements": [
      {
        "type": "plain_text",
        "text": `Report generated at ${date}`,
        "emoji": true
      }
    ]
  })

  await client.chat.postMessage({
    "channel": 'G019S5JBHDY',
    "blocks": task_report
  });
})

app.command('/new-request', async ({ ack, body, client, logger }) => {
  await ack();

  try {
    const result = await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'marketing_request',
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
            "type": "section",
            block_id: 'department',
            "text": {
              "type": "mrkdwn",
              "text": "What do you need help with?"
            },
            "accessory": {
              "type": "static_select",
              "placeholder": {
                "type": "plain_text",
                "text": "Select...",
                "emoji": true
              },
              "options": [
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Graphic (For Social Media)",
                    "emoji": true
                  },
                  "value": "value-0"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Graphic (Not for Posting)",
                    "emoji": true
                  },
                  "value": "value-1"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Video",
                    "emoji": true
                  },
                  "value": "value-2"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Website Update",
                    "emoji": true
                  },
                  "value": "value-3"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Blog/Podcast",
                    "emoji": true
                  },
                  "value": "value-4"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Newsletter Item",
                    "emoji": true
                  },
                  "value": "value-5"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Other",
                    "emoji": true
                  },
                  "value": "value-6"
                }
              ],
              "action_id": "static_select-action"
            }
          },
          {
            type: 'input',
            block_id: 'task_required',
            label: {
              type: 'plain_text',
              text: 'What task do you need help with? Provide as many details as you can!'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'task_input',
              multiline: true
            }
          },
          {
            type: 'input',
            block_id: 'info_docs',
            optional: true,
            label: {
              type: 'plain_text',
              text: 'Link any documents/files with relevant info:'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'info_input',
              multiline: true
            }
          },
          {
            "type": "section",
            block_id: 'deadline',
            "text": {
              "type": "mrkdwn",
              "text": "When do you need the task done for? Please send requests at least 2 weeks in advance!"
            },
            "accessory": {
              "type": "datepicker",
              "placeholder": {
                "type": "plain_text",
                "text": "Select a date",
                "emoji": true
              },
              "action_id": "datepicker-action"
            },
          },
          {
            "type": "section",
            block_id: 'requester',
            "text": {
              "type": "mrkdwn",
              "text": "Who should marketing be in contact with about this request? Enter your name!"
            },
            "accessory": {
              "type": "users_select",
              "placeholder": {
                "type": "plain_text",
                "text": "Select a user",
                "emoji": true
              },
              "action_id": "users_select-action"
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

app.view('marketing_request', async ({ ack, view, client, logger }) => {
  await ack();
  const info = view.state.values['info_docs']['info_input'].value;
  const task = view.state.values['task_required']['task_input'].value;
  const deadline = view.state.values['deadline']['datepicker-action']['selected_date'];
  const department = view.state.values['department']['static_select-action']['selected_option']['text']['text'];
  const requester = view.state.values['requester']['users_select-action']['selected_user'];

  let responsible = '';
  let channel = '';

  switch (department) {
    case "Video":
      responsible = "U02BMAYL41F";
      channel = "G01AL7TMR9D";
      break;
    case "Website Update":
      responsible = "U02BMAYL41F";
      channel = "G01FND37QFP";
      break;
    case "Graphic (For Social Media)":
      responsible = "U01T1RNF5J8";
      channel = "G015YGQP6A0";
      break;
    case "Graphic (Not for Posting)":
      responsible = "U01TKEZDMEU";
      channel = "G01AL7TMR9D";
      break;
    case "Newsletter Item":
      responsible = "U03GJJM191C";
      channel = "G0192EEJBFS"
      break;
    case "Blog/Podcast":
      responsible = "U03GJJM191C";
      channel = "G0192EEJBFS"
      break;
    default:
      responsible = "U01TKEZDMEU";
      channel = "G019S5JBHDY"
      break;
  }

  const row = await Tasks.create({
    info: info,
    task: task,
    responsible: responsible,
    deadline: deadline,
  })

  try {
    await client.chat.postMessage({
      channel: channel,
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `New ${department} request for <@${responsible}>`
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*Deadline:* ${deadline}`
          }
        },
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "emoji": true,
                "text": "View Task Info"
              },
              "style": "primary",
              "confirm": {
                "title": {
                    "type": "plain_text",
                    "text": "Full Task Info"
                },
                "text": {
                    "type": "mrkdwn",
                    "text": `Task: ${task}\n\nInfo: ${info || 'No linked information'}`
                },
                "confirm": {
                    "type": "plain_text",
                    "text": "Got it!"
                },
                "deny": {
                    "type": "plain_text",
                    "text": "Close"
                }
              }
            },
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "emoji": true,
                "text": "In Progress"
              },
              "value": "in_progress",
              "action_id": "in_progress"
            },
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "emoji": true,
                "text": "Complete"
              },
              "style": "primary",
              "value": "complete",
              "action_id": "complete"
            }
          ]
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": `Sent from: <@${requester}>`,
            }
          ]
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": `Task #${row.id}`,
            }
          ]
        }
      ]
    });

    await client.chat.postMessage({
      channel: requester,
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Hello, your task has been submitted! 🐸 \n Stay tuned for a message in #marketing-requests when your task has been completed!"
          }
        }
      ]
    })
  }
  catch (error) {
    logger.error(error);
  }


});

app.action('in_progress', async ({ body, ack, client }) => {
  await ack();
  try {
    await client.reactions.add({
      "name": "eyes",
      "channel": body['container']['channel_id'],
      "timestamp": body['container']['message_ts']
    });
  }
  catch (error) {
    logger.error(error);
  }
});

app.action('complete_v2', async ({ body, ack, client }) => {
  await ack();
  console.log(body)
  console.log(body.actions[0].value)
  console.log(body.actions[0].text.text.slice(15))

  const task_id = body.actions[0].value;
  const requester = body.actions[0].text.text.slice(15);

  await Tasks.destroy({
    where: {
      id: task_id
    }
  })

  await client.chat.postMessage({
    "channel": 'C03MAUP6G2C',
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Your task is done ! <@${requester}>`,
        },
        "accessory": {
          "type": "image",
          "image_url": "https://source.unsplash.com/collection/56859352/480x480",
          "alt_text": "cute frog",
        }
      }
    ]
  });
})

app.action('complete', async ({ body, ack, client }) => {
  await ack();
  try {
    await client.reactions.add({
      "name": "white_check_mark",
      "channel": body['container']['channel_id'],
      "timestamp": body['container']['message_ts'],
    });

    const requester = body['message']['blocks'][3]['elements'][0]['text'].substring(11);
    const task_id = body['message']['blocks'][4]['elements'][0]['text'].substring(6);

    await Tasks.destroy({
      where: {
        id: task_id
      }
    })

    await client.chat.postMessage({
      "channel": 'C03MAUP6G2C',
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `Your task is done ! ${requester}`,
          },
          "accessory": {
            "type": "image",
            "image_url": "https://source.unsplash.com/collection/56859352/480x480",
            "alt_text": "cute frog",
          }
        }
      ]
    });
  }
  catch (error) {
    logger.error(error);
  }
});

async function main() {
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
};

main();