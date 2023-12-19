import { faker } from "@faker-js/faker";
import { IStockSimMovementBias } from "./stock_market_sim";

export class StockMarketModifiers {
  base: IStockSimMovementBias;
  effects: IStockMarketModifierEffects[];

  constructor(base: IStockSimMovementBias) {
    this.base = base;
    this.effects = [];
  }

  getBias(): IStockSimMovementBias {
    const bias = { ...this.base };
    const computedEffects: Partial<IStockSimMovementBias>[] = [];

    // check if there are absolute effects, replace the bias with the sum of all absolute effects
    let implementedAbsoluteEffect = false;
    const updateAbsoluteEffect = {
      volatility: false,
      prospect: false,
      prospectVolatility: false,
      hype: false,
    };
    const totalAbsoluteEffect = {
      volatility: 0,
      prospect: 0,
      prospectVolatility: 0,
      hype: 0,
    };
    for (const effect of this.effects) {
      if (effect.type === "absolute") {
        implementedAbsoluteEffect = true;
        updateAbsoluteEffect.volatility =
          effect.effects.volatility !== undefined;
        updateAbsoluteEffect.prospect = effect.effects.prospect !== undefined;
        updateAbsoluteEffect.prospectVolatility =
          effect.effects.prospectVolatility !== undefined;
        updateAbsoluteEffect.hype = effect.effects.hype !== undefined;
        totalAbsoluteEffect.volatility += effect.effects.volatility ?? 0;
        totalAbsoluteEffect.prospect += effect.effects.prospect ?? 0;
        totalAbsoluteEffect.prospectVolatility +=
          effect.effects.prospectVolatility ?? 0;
        totalAbsoluteEffect.hype += effect.effects.hype ?? 0;
      }
    }
    if (implementedAbsoluteEffect) {
      if (updateAbsoluteEffect.volatility) {
        bias.volatility = totalAbsoluteEffect.volatility;
      }
      if (updateAbsoluteEffect.prospect) {
        bias.prospect = totalAbsoluteEffect.prospect;
      }
      if (updateAbsoluteEffect.prospectVolatility) {
        bias.prospectVolatility = totalAbsoluteEffect.prospectVolatility;
      }
      if (updateAbsoluteEffect.hype) {
        bias.hype = totalAbsoluteEffect.hype;
      }
    }

    // Compute all effects
    for (const effect of this.effects) {
      if (effect.type === "flat") {
        computedEffects.push(effect.effects);
      } else {
        const volatity = effect.effects.volatility ?? 0;
        const volatityDirection = volatity > 0 ? 1 : -1;
        const prospect = effect.effects.prospect ?? 0;
        const prospectDirection = prospect > 0 ? 1 : -1;
        const hype = effect.effects.hype ?? 0;
        const hypeDirection = hype > 0 ? 1 : -1;
        const prospectVolatility =
          effect.effects.prospectVolatility ?? 0 * volatityDirection;
        const prospectVolatilityDirection = prospectVolatility > 0 ? 1 : -1;

        computedEffects.push({
          volatility: volatityDirection * bias.volatility * Math.abs(volatity),
          prospect: prospectDirection * bias.prospect * Math.abs(prospect),
          prospectVolatility:
            prospectVolatilityDirection *
            bias.prospectVolatility *
            Math.abs(prospectVolatility),
          hype: hypeDirection * bias.hype * Math.abs(hype),
        });
      }
    }

    // Sum all effects
    for (const effect of computedEffects) {
      bias.volatility += effect.volatility ?? 0;
      bias.prospect += effect.prospect ?? 0;
      bias.prospectVolatility += effect.prospectVolatility ?? 0;
      bias.hype += effect.hype ?? 0;
    }

    return bias;
  }

  addEffect(
    effect: IStockMarketModifierEffects,
    curTime?: number
  ): IStockSimMovementBias {
    // check if effect already exists
    const stackAmount = this.effects.filter((e) => e.name === effect.name);

    if (stackAmount.length >= effect.stack) {
      return this.getBias();
    }

    // check if effect is opposed
    for (const oppose of effect.oppose) {
      const opposedEffect = this.effects.find((e) => e.name === oppose);
      if (opposedEffect) {
        return this.getBias();
      }
    }

    let currentTime = curTime ?? Date.now();
    currentTime += effect.duration * 3600 * 1000;
    this.effects.push({
      ...effect,
      description: effect.messageGenerator(),
      duration: currentTime,
    });

    return this.getBias();
  }

  tickEffect(currentTime: number): IStockSimMovementBias {
    for (let i = 0; i < this.effects.length; i++) {
      const effect = this.effects[i];
      if (currentTime >= effect.duration) {
        this.effects.splice(i, 1);
      }
    }

    return this.getBias();
  }
}

export interface IStockMarketModifierEffects {
  name: string;
  description: string;
  duration: number; // duration in hours
  effects: Partial<IStockSimMovementBias>;
  type: "percent" | "flat" | "absolute";
  stack: number;
  oppose: string[];
  messageGenerator: () => string;
}

export const marketModifiers: IStockMarketModifierEffects[] = [
  {
    name: "Market Crash",
    description: "The market is crashing!",
    duration: 24 * 10,
    type: "absolute",
    effects: {
      prospect: -0.5,
      prospectVolatility: 0.25,
      volatility: 0.001,
    },
    stack: 1,
    oppose: ["Market Boom"],
    messageGenerator: () => {
      const possibleMessages = [
        "Company filed for bankruptcy! Stock price has plummeted!",
        "Company has been accused of fraud! Stock price has plummeted!",
        "Company has been accused of insider trading! Stock price has plummeted!",
        "Company assets have been frozen! Stock price has plummeted!",
        "Company production has been halted! Stock price has plummeted!",
      ];

      return possibleMessages[
        Math.floor(Math.random() * possibleMessages.length)
      ];
    },
  },
  {
    name: "Market Boom",
    description: "The market is booming!",
    duration: 24 * 5,
    type: "flat",
    effects: {
      prospect: 0.2,
      hype: 0.2,
    },
    stack: 1,
    oppose: ["Market Crash"],
    messageGenerator: () => {
      const possibleMessages = [
        "Company has been acquired by a larger company! Stock price has skyrocketed!",
        "Company has secured a large contract! Stock price has skyrocketed!",
        "Company has been granted a patent! Stock price has skyrocketed!",
        "Company has been granted a government contract! Stock price has skyrocketed!",
      ];

      return possibleMessages[
        Math.floor(Math.random() * possibleMessages.length)
      ];
    },
  },
  {
    name: "A New CEO in Town",
    description: "A new CEO has taken over the company!",
    duration: 24 * 3,
    type: "percent",
    effects: {
      volatility: 0.75,
      prospect: 0.5,
      prospectVolatility: 0.5,
      hype: 0.75,
    },
    stack: 1,
    oppose: [],
    messageGenerator: () => {
      const ceoName = `${faker.name.firstName()} ${faker.name.lastName()}`;
      const possibleMessages = [
        `Company has a new CEO! ${ceoName} has taken over the company!`,
        `${ceoName}, former employee of the company, has taken over as CEO!`,
      ];

      return possibleMessages[
        Math.floor(Math.random() * possibleMessages.length)
      ];
    },
  },
  {
    name: "A New Project",
    description: "A new project has been announced!",
    duration: 24 * 3,
    type: "percent",
    effects: {
      volatility: 0.15,
      prospect: 0.15,
      prospectVolatility: 0.15,
      hype: 0.15,
    },
    stack: 5,
    oppose: [],
    messageGenerator: () => {
      const newProduct = faker.commerce.productName();
      const newAction = faker.commerce.productAdjective();
      const possibleMessages = [
        `Company has announced a new project! ${newAction} ${newProduct}!`,
        `Company released a press statement! ${newAction} ${newProduct}!`,
        `Company made a new discovery in ${newProduct}!`,
      ];

      return possibleMessages[
        Math.floor(Math.random() * possibleMessages.length)
      ];
    },
  },
  {
    name: "Scandal!",
    description: "A scandal has been revealed!",
    duration: 24 * 3,
    type: "flat",
    effects: {
      prospect: -0.3,
      hype: -0.3,
      volatility: 0.01,
    },
    stack: 3,
    oppose: [],
    messageGenerator: () => {
      const lawSuit = faker.company.buzzVerb();
      const possibleMessages = [
        `Company has been accused of ${lawSuit} fraud!`,
        `Company has been involved with a(n) ${lawSuit} mafia, and is under investigation!`,
        `Company was rumored to be involved in a(n) ${lawSuit} scandal!`,
      ];

      return possibleMessages[
        Math.floor(Math.random() * possibleMessages.length)
      ];
    },
  },
  {
    name: "Lawsuit",
    description: "The company is being sued!",
    duration: 24 * 5,
    type: "percent",
    effects: {
      volatility: 2,
      prospect: -0.5,
      prospectVolatility: 0.5,
      hype: -0.5,
    },
    stack: 3,
    oppose: [],
    messageGenerator: () => {
      const lawsuitName = faker.company.buzzVerb();
      const lawsuitName2 = faker.company.buzzNoun();
      const possibleMessages = [
        `Company is in trial with the ${lawsuitName} ${lawsuitName2} case!`,
        `Company is being sued for ${lawsuitName} ${lawsuitName2} case!`,
        `Company was demanding a(n) ${lawsuitName} ${lawsuitName2} issue trial!`,
      ];

      return possibleMessages[
        Math.floor(Math.random() * possibleMessages.length)
      ];
    },
  },
  {
    name: "Marketing Campaign",
    description: "A new marketing campaign has been launched!",
    duration: 24 * 5,
    type: "percent",
    effects: {
      volatility: 0.1,
      prospect: 0.15,
      prospectVolatility: 0.3,
      hype: 0.2,
    },
    stack: 5,
    oppose: ["Scandal"],
    messageGenerator: () => {
      const campaignName = faker.company.buzzVerb();
      const possibleMessages = [
        `Company has launched a new marketing campaign! Project: ${campaignName}!`,
      ];

      return possibleMessages[
        Math.floor(Math.random() * possibleMessages.length)
      ];
    },
  },
  {
    name: "Award",
    description: "The company has won an award!",
    duration: 24 * 2,
    type: "percent",
    effects: {
      volatility: 0.2,
      prospect: 0.3,
      prospectVolatility: 0.2,
      hype: 0.25,
    },
    stack: 3,
    oppose: ["Scandal"],
    messageGenerator: () => {
      const animalName = faker.animal.type();
      const animalAction = faker.company.buzzVerb();
      const possibleMessages = [
        `Company has won the ${animalName} ${animalAction} award!`,
      ];

      return possibleMessages[
        Math.floor(Math.random() * possibleMessages.length)
      ];
    },
  },
];

export function getRandomModifier(): IStockMarketModifierEffects {
  return marketModifiers[Math.floor(Math.random() * marketModifiers.length)];
}
