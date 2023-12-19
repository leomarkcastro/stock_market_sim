import {
  StockMarketModifiers,
  getRandomModifier,
} from "../functions/stock_market_mod";
import { StockSimulator } from "../functions/stock_market_sim";
import { InfluxClient } from "../functions/influxdb";
import dotenv from "dotenv";

dotenv.config();

const ENV = process.env;

const config = {
  token: ENV.INFLUX_TOKEN ?? "195e4aa5f93286e818d7ed47",
  org: ENV.INFLUX_ORG ?? "my-org",
  bucket: ENV.INFLUX_BUCKET ?? "mock_stock",
  stock_prospect: ENV.STOCK_PROSPECT ?? "0.1",
  stock_prospect_volatility: ENV.STOCK_PROSPECT_VOLATILITY ?? "0.5",
  stock_volatility: ENV.STOCK_VOLATILITY ?? "0.001",
  stock_hype: ENV.STOCK_HYPE ?? "0.3",
  stock_starting_price: ENV.STOCK_STARTING_PRICE ?? "100",
  stock_event_hours: ENV.STOCK_EVENT_HOURS ?? "2",
  stock_name: ENV.STOCK_NAME ?? "BNN",
};

async function lastPrice() {
  const influxClient = new InfluxClient(
    config.token,
    config.org,
    config.bucket
  );

  const query = `
    from(bucket: "${influxClient.bucket}") 
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "stock" and r.host == "${config.stock_name}" and r._field == "price")
      |> last()
  `;
  // console.log(query);
  const results = (await influxClient.query(query)) as any;

  // console.log(results);

  return Number(results?.[0]?._value ?? config.stock_starting_price);
}

async function main() {
  console.log("Running STOCK Simulator");
  console.log("  Config: ");
  for (let [key, value] of Object.entries(config)) {
    console.log(`  >  ${key}: ${value}`);
  }

  const company = new StockMarketModifiers({
    prospect: Number(config.stock_prospect),
    prospectVolatility: Number(config.stock_prospect_volatility),
    volatility: Number(config.stock_volatility),
    hype: Number(config.stock_hype),
  });

  return console.log(await lastPrice());

  const stock = new StockSimulator(await lastPrice(), company.getBias());

  const influxClient = new InfluxClient(
    config.token,
    config.org,
    config.bucket
  );

  // run every 2 hours
  const eventHours = 1000 * 60 * 60 * Number(config.stock_event_hours);
  setInterval(() => {
    company.addEffect(getRandomModifier());
  }, eventHours);

  const tickDuration = 2000;
  setInterval(async () => {
    stock.updatePrice();
    stock.updateMovementBias(company.tickEffect(Date.now()));

    let price = stock.price;

    await influxClient.write(config.stock_name, "stock", { price: price }, {});
  }, tickDuration);
}

main();
