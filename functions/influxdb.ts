import { InfluxDB, Point } from "@influxdata/influxdb-client";

// You can generate a Token from the "Tokens Tab" in the UI

export class InfluxClient {
  client: InfluxDB;
  org: string;
  bucket: string;

  constructor(
    token: string,
    org: string,
    bucket: string,
    url: string = "https://influx1.app01.xyzapps.xyz"
  ) {
    this.client = new InfluxDB({
      url,
      token,
    });
    this.org = org;
    this.bucket = bucket;
  }

  async write(
    host: string,
    point_name: string,
    fields: { [key: string]: number },
    tags: { [key: string]: string }
  ) {
    const writeApi = this.client.getWriteApi(this.org, this.bucket);
    writeApi.useDefaultTags({ host });

    const point = new Point(point_name);
    for (const [key, value] of Object.entries(fields)) {
      point.floatField(key, value);
    }
    for (const [key, value] of Object.entries(tags)) {
      point.tag(key, value);
    }
    writeApi.writePoint(point);
    await writeApi.close();
  }

  async query(iql: string) {
    const queryApi = this.client.getQueryApi(this.org);

    // create a query that fetches from bucket and takes the last entry
    // const query = `
    //   from(bucket: "${this.bucket}")
    //     |> range(start: -1h)
    //     |> filter(fn: (r) => r.sensor_id == "sensor_11" and r.location == "west-usa")
    //     |> last()
    // `;
    const query = iql;

    const results = await queryApi.collectRows(query);

    return results;
  }
}
