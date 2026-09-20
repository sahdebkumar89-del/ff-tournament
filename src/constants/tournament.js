export const TOURNAMENT_MODES = {
  SOLO: "SOLO",
  DUO: "DUO",
  SQUAD: "SQUAD",
};

export const TOURNAMENT_CONFIG = {
  SOLO: {
    entryFee: 10,
    firstPrize: 50,
    secondPrize: 40,
    thirdPrize: 30,
    killReward: 5,
    maxPlayers: 50,
    maxTeams: null,
  },

  DUO: {
    entryFee: 20,
    firstPrize: 70,
    secondPrize: 50,
    thirdPrize: 30,
    killReward: 5,
    maxPlayers: 50,
    maxTeams: 25,
  },

  SQUAD: {
    entryFee: 50,
    firstPrize: 120,
    secondPrize: 80,
    thirdPrize: 60,
    killReward: 5,
    maxPlayers: 48,
    maxTeams: 12,
  },
};

// Daily BR slots run from 09:00 through the 23:30 final start slot.
// The 23:30 slot finishes at 00:00 the following calendar day.
export const TOURNAMENT_SCHEDULE = {
  startTime: "09:00",
  endTime: "23:30",
  intervalMinutes: 30,
  rotation: ["SOLO", "DUO", "SQUAD"],
};

export const ROOM_RELEASE_MINUTES_BEFORE = 10;
export const NEXT_DAY_REGISTRATION_MINUTES_AFTER_FINISH = 60;
export const MIN_WITHDRAWAL_AMOUNT = 50;
