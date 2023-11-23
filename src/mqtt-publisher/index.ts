import { MqttClient, connect } from 'mqtt';

interface Publisher {
  topic: string;
  message: Buffer;
}

interface Subscriber {
  topic: string;
  subscribed: boolean;
}

export interface MqttWorker {
  sender: Publisher;
  receiver: Subscriber;
}

export default function parseTcpPacket(packet: Buffer): MqttWorker {
  const topic = 'testtopic/hardcoded';
  const message = packet;
  return {
    sender: { topic, message },
    receiver: { topic, subscribed: false },
  };
}
