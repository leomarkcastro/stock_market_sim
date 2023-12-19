import {
  StockMarketModifiers,
  getRandomModifier,
} from "../functions/stock_market_mod";
import { StockSimulator } from "../functions/stock_market_sim";
import fs from "fs";

// clear file
fs.writeFileSync("stock.txt", "");

function writeToFile(data: string) {
  fs.appendFileSync("stock.txt", data + "\n");
}

async function main() {
  const company = new StockMarketModifiers({
    prospect: 0.2,
    prospectVolatility: 0.5,
    volatility: 0.001,
    hype: 0.3,
  });

  const stock = new StockSimulator(100, company.getBias());
  let time = Date.now();

  for (let i = 0; i < 100; i++) {
    writeToFile(`Stock Price: $${stock.price.toFixed(2)}`);
    stock.updatePrice();
  }

  for (let j = 0; j < 20; j++) {
    company.addEffect(getRandomModifier());
    writeToFile("Events:");
    company.effects.forEach((effect) => {
      writeToFile(effect.description);
    });
    writeToFile(JSON.stringify(company.getBias()));

    for (let i = 0; i < 20; i++) {
      writeToFile(`Stock Price: $${stock.price.toFixed(2)}`);
      stock.updatePrice();
      stock.updateMovementBias(company.tickEffect(time));

      // move time by 2 hours
      time += 1000 * 60 * 60 * 1;
    }
  }
}

main();
