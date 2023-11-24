import { MqttClient } from 'mqtt';
import * as net from 'net';

export interface Worker {
  socket: net.Socket;
  data: Buffer;
  pubTopic: string;
  subTopic: string;

  subscribed: boolean;
}

export function subscribe(worker: Worker, client: MqttClient): Worker {
  if (!worker.subscribed) {
    client.subscribe(worker.subTopic, (err) => {
      if (err) throw err;
    });
    worker.subscribed = true;
  }

  return worker;
}

export function publish(worker: Worker, client: MqttClient): Worker {
  if (worker.subscribed) {
    client.publish(worker.pubTopic, worker.data, (err) => {
      if (err) throw err;
    });
  }

  return worker;
}

// send returned message from broker to socket
export function send(worker: Worker, client: MqttClient) {
  client.on('message', (topic, message) => {
    console.log('[topic %s - messageId %s]', topic, client.getLastMessageId());
    worker.socket.write(message);
  });
}
