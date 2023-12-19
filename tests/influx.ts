import { InfluxDB, Point } from "@influxdata/influxdb-client";

// You can generate a Token from the "Tokens Tab" in the UI
const token = "195e4aa5f93286e818d7ed47";
const org = "my-org";
const bucket = "my-bucket";

const client = new InfluxDB({
  url: "https://influx1.app01.xyzapps.xyz",
  token: token,
});

function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function write() {
  const writeApi = client.getWriteApi(org, bucket);
  writeApi.useDefaultTags({ host: "host1" });

  const point = new Point("mem").floatField(
    "used_percent",
    randomFloat(1, 100)
  );
  // add location information
  point.tag("location", "west-usa");
  // add sensor id
  point.tag("sensor_id", "sensor_11");
  // use custom timestamp
  // point.timestamp(new Date().getTime() * 1000000);

  writeApi.writePoint(point);
  await writeApi.close();
  console.log("write success");
}

async function getLastEntry() {
  const queryApi = client.getQueryApi(org);

  // create a query that fetches from bucket and takes the last entry
  const query = `
    from(bucket: "${bucket}") 
      |> range(start: -1h) 
      |> filter(fn: (r) => r.sensor_id == "sensor_11" and r.location == "west-usa") 
      |> last()
  `;
  queryApi.queryRows(query, {
    next(row, tableMeta) {
      const o = tableMeta.toObject(row);
      console.log(
        `${o._time} ${o._measurement} in '${o.location}' (${o.sensor_id}): ${o._field}=${o._value}`
      );
    },
    error(error) {
      console.error(error);
      console.log("\nFinished ERROR");
    },
    complete() {
      console.log("\nFinished SUCCESS");
    },
  });
}

async function fetch() {
  const queryApi = client.getQueryApi(org);

  const query = `from(bucket: "${bucket}") |> range(start: -5m)`;
  queryApi.queryRows(query, {
    next(row, tableMeta) {
      const o = tableMeta.toObject(row);
      console.log(
        `${o._time} ${o._measurement} in '${o.location}' (${o.sensor_id}): ${o._field}=${o._value}`
      );
    },
    error(error) {
      console.error(error);
      console.log("\nFinished ERROR");
    },
    complete() {
      console.log("\nFinished SUCCESS");
    },
  });
}

async function main() {
  // while (true) {
  //   await write();
  //   await sleep(250);
  // }
  await getLastEntry();
}

main();
