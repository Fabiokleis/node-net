import { MqttClient } from 'mqtt';
import * as net from 'net';

export interface Worker {
    socket: net.Socket;
    data: Buffer;
    pubTopic: string;
    subTopic: string;

    subscribed: boolean;
}
// tcp message json
interface Message {
    awesomeField: string;
    deviceName?: string;
}

function parseTcpBuffer(buffer: Buffer): Message | Buffer {
    try {
        const { awesomeField, deviceName } = JSON.parse(buffer.toString());
        return {
            awesomeField,
            deviceName,
        };
    } catch (err) {
        if (!(err instanceof SyntaxError)) console.log(err);
    }
    return buffer;
}

function decode(root: any, data: Buffer): Message {
    const AwesomeMessage = root.lookupType('awesomepackage.AwesomeMessage');
    return AwesomeMessage.decode(data);
}

export function encode(root: any, data: Buffer): Buffer {
    const AwesomeMessage = root.lookupType('awesomepackage.AwesomeMessage');

    const parsed = parseTcpBuffer(data);
    if (parsed instanceof Buffer) return data;

    let message = AwesomeMessage.create(parsed);

    let buffer = AwesomeMessage.encode(message).finish();

    return Buffer.from(buffer);
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
export function send(worker: Worker, client: MqttClient, root: any) {
    client.on('message', (topic, message) => {
        console.log(
            '[topic %s - messageId %s]',
            topic,
            client.getLastMessageId()
        );

        const decoded = decode(root, encode(root, message)); // message
        console.log(decoded);
        worker.socket.write(Buffer.from(JSON.stringify(decoded)));
    });
}
