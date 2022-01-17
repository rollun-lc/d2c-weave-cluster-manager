import { Axios } from 'axios';
import { SLACK } from '../../config/config.js';

export class SlackChannel {
  write(level, title, payload) {
    Axios({
      url: SLACK.ALERT_CHANNEL_WEBHOOK,
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      data: getMessage(level, title, payload),
    })
  }
}

function getMessage(level, title, payload) {
  return {
    "blocks": [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": `Notification from D2C Cluster manager. ${level}`
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Level*: *${level}*`
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": title
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `\`\`\`${JSON.stringify(payload, null, 2)}\`\`\``,
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "D2C pannel"
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Go"
          },
          "value": "Go",
          "url": "https://panel.d2c.io/dashboard",
          "action_id": "button-action"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "D2C Cluster manager"
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Go"
          },
          "value": "Go",
          "url": "https://github.com/rollun-com/d2c-weave-cluster-manager",
          "action_id": "button-action"
        }
      }
    ]
  }
}
