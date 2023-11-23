import * as net from 'net';
import { connect } from 'mqtt';

import parseTcpPacket, { MqttWorker } from '@mqtt-publisher';

interface Worker {
  socket: net.Socket;
  mqttWorker: MqttWorker;
}

const MAX_CONNECTIONS = 2;

const workers: Worker[] = [];

const server = net.createServer();
let connections = 0;

async function start() {
  server.on('connection', async (client: net.Socket) => {
    console.log(`socket: ${client.remoteAddress}:${client.remotePort}`);

    if (connections < MAX_CONNECTIONS) {
      const workerData = {
        socket: client,
        mqttWorker: parseTcpPacket(Buffer.from('')),
      };
      connections++;
      // add new tcp mqtt worker
      workers.push(workerData);
    }

    workers.forEach((worker, _) => {
      worker.socket.on('data', (data: Buffer) => {
        worker.mqttWorker = parseTcpPacket(data);
        execute(worker);
      });
    });
  });

  server.on('error', (err) => {
    throw err;
  });

  server.listen(8124, () => {
    console.log('server bound');
  });
}

function execute(worker: Worker) {
  const client = connect('mqtt://broker.emqx.io');
  client.on('connect', () => {
    if (!worker.mqttWorker.receiver.subscribed) {
      client.subscribe(worker.mqttWorker.receiver.topic, (err) => {
        if (err) throw err;
      });
      worker.mqttWorker.receiver.subscribed = true;
    }
    client.publish(
      worker.mqttWorker.sender.topic,
      worker.mqttWorker.sender.message,
      (err) => {
        if (err) throw err;
      }
    );
  });

  client.on('message', (_topic, message) => {
    worker.socket.write(message);
  });
}

start();
