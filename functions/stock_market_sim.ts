export interface IStockSimMovementBias {
  volatility: number; // [Limit to 0.00001 and 1] the randomness of the movement percentage relative to its current price (0.1 = 10%)
  prospect: number; // the likelihood of the movement being positive or negative (0.1 = 10%)
  prospectVolatility: number; // [Limit to 0 and 1] the effectiveness of prospect movement (0.1 = 10%)
  hype: number; // [Limit 0 to 1] the likelihood of the movement being large (0.1 = 10%), this only affects movement inline with the prospect
  // hyped movements are 2x as large as normal movements
}

export class StockSimulator {
  price: number;
  movementBias: IStockSimMovementBias;
  lowestVolatity = 0.00001;
  highestVolatity = 1;
  lowestProspectVolatility = 0.00001;
  highestProspectVolatility = 1;

  constructor(
    initialPrice: number,
    movementBias?: Partial<IStockSimMovementBias>
  ) {
    this.price = initialPrice;
    this.movementBias = {
      volatility: movementBias?.volatility ?? 0,
      prospect: movementBias?.prospect ?? 0,
      prospectVolatility: movementBias?.prospectVolatility ?? 0,
      hype: movementBias?.hype ?? 0,
    };
  }

  updateMovementBias(movementBias: Partial<IStockSimMovementBias>) {
    this.movementBias = {
      ...this.movementBias,
      ...movementBias,
    };
  }

  baseMinMax(base: number, min: number, max: number) {
    return Math.max(Math.min(base, max), min);
  }

  updatePrice() {
    // Infer next price
    // 1. Get base movement (1 to -1), bias the movement by prospect
    // * if the prospect is +10%, then the chance of positive movement is 110% and negative is 90%
    const baseMovement = this.baseMinMax(
      Math.random() * 2 -
        1 +
        this.movementBias.prospect *
          this.baseMinMax(
            this.movementBias.prospectVolatility,
            this.lowestProspectVolatility,
            this.highestProspectVolatility
          ),
      -1,
      1
    );
    // 2. Apply volatility to the base movement
    let movement =
      baseMovement *
      this.baseMinMax(
        this.movementBias.volatility,
        this.lowestVolatity,
        this.highestVolatity
      );
    // 3. Apply hype to the movement (if applicable)
    if (
      (movement > 0 && this.movementBias.prospect > 0) ||
      (movement < 0 && this.movementBias.prospect < 0)
    ) {
      const hypeCheck = Math.random();
      if (hypeCheck < this.baseMinMax(this.movementBias.hype, 0, 1)) {
        movement *= 2;
      }
    }
    movement *= this.price;

    // Update stock price
    this.price += movement;

    // price should never be negative
    this.price = Math.max(this.price, 0.00001);

    return this.price;
  }

  printPrice() {
    // Log the updated price
    console.log(`Stock Price: $${this.price.toFixed(2)}`);
  }
}

// const stock = new StockSimulator(100, {
//   prospect: -0.2,
//   prospectVolatility: 0.5,
//   hype: 0.2,
//   volatility: 0.01,
// });

// const simulate = setInterval(() => {
//   stock.updatePrice();
//   stock.printPrice();
// }, 500);

// setTimeout(() => {
//   clearInterval(simulate);
// }, 60000);
