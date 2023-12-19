import { InfluxClient } from "../functions/influxdb";

const token = "195e4aa5f93286e818d7ed47";
const org = "my-org";
const bucket = "my-bucket";

function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const influxClient = new InfluxClient(token, org, bucket);
  for (let i = 0; i < 10; i++) {
    await influxClient.write(
      "host2",
      "mem",
      { used_percent: randomFloat(0, 100) },
      {}
    );
    await sleep(1000);
  }
  const query = `
    from(bucket: "${influxClient.bucket}") 
      |> range(start: -1h)
  `;
  const results = await influxClient.query(query);
  console.log(results);
}
main();
