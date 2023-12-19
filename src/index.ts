import {
  StockMarketModifiers,
  getRandomModifier,
} from "../functions/stock_market_mod";
import { StockSimulator } from "../functions/stock_market_sim";
import { InfluxClient } from "../functions/influxdb";

const token = "195e4aa5f93286e818d7ed47";
const org = "my-org";
const bucket = "mock_stock";

async function main() {
  const company = new StockMarketModifiers({
    prospect: 0.1,
    prospectVolatility: 0.5,
    volatility: 0.001,
    hype: 0.3,
  });

  const stock = new StockSimulator(100, company.getBias());

  const influxClient = new InfluxClient(token, org, bucket);

  // run every 2 hours
  const eventHours = 1000 * 60 * 60 * 2;
  setInterval(() => {
    company.addEffect(getRandomModifier());
  }, eventHours);

  const tickDuration = 2000;
  setInterval(async () => {
    stock.updatePrice();
    stock.updateMovementBias(company.tickEffect(Date.now()));

    let price = stock.price;

    await influxClient.write("BNN", "stock", { price: price }, {});
  }, tickDuration);
}

main();
