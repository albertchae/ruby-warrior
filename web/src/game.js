import { cacheKey, getPlayerRecord, setPlayerRecord, getAllPlayerRecords } from './storage.js';

function formatElapsedTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

class OutputPrinter {
  RESET_PHRASES =
    /(- turn \d+ -|Success! You have found the stairs|CONGRATULATIONS!|Sorry, you failed level)/;

  IGNORE_PHRASES = /(\[yn\]|See the updated README)/;

  constructor(el) {
    this.el = el;
    this.currentItem = el.querySelector("sl-carousel-item:last-child div");
    this.print("\n");
  }

  print(val) {
    console.log(val);

    if (this.IGNORE_PHRASES.test(val)) return;

    if (this.RESET_PHRASES.test(val)) {
      let classes = this.currentItem.getAttribute("class");
      this.el.insertAdjacentHTML('beforeend', `<sl-carousel-item class="w-full h-full"><div>
        </div></sl-carousel-item>`);
      this.currentItem = this.el.querySelector("sl-carousel-item:last-child div");
      this.currentItem.setAttribute("class", classes);
      this.currentItem.textContent = val;
      this.el.next();
    } else {
      this.currentItem.textContent += val;
    }
  }

  puts(val) {
    this.print(val + "\n");
  }
}

class Sleeper {
  constructor() {
    this._nextSleep = undefined;
  }

  nextSleep(val) {
    this._nextSleep = val;
  }

  async sleep() {
    if (!this._nextSleep) return;

    await new Promise((resolve) => {
      setTimeout(resolve, this._nextSleep * 1000);
    });
  }
}

class Leaderboard {
  MAX_LEADERBOARD_ENTRIES = 10;

  constructor(vm, tbodyId = 'leaderboard-body', currentPlayerName = null) {
    this.vm = vm;
    this.tbodyId = tbodyId;
    this.currentPlayerName = currentPlayerName;
  }

  showLoading() {
    const tbody = document.getElementById(this.tbodyId);
    if (!tbody) return;

    tbody.innerHTML = '';
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 3;
    cell.className = 'px-6 py-4 text-center text-sm text-gray-500';
    cell.innerHTML = '<sl-spinner></sl-spinner> <span class="ml-2">Loading leaderboard...</span>';
    row.appendChild(cell);
    tbody.appendChild(row);
  }

  update() {
    const playerRecords = getAllPlayerRecords();
    let leaderboardEntries = []

    for (let { gameDir, profile, startTimeUnixMs, scoredTimeUnixMs } of playerRecords) {
      this.vm.eval(`
      FileUtils.mkdir_p("${gameDir}")
      File.write("${gameDir}/.profile", <<~'SRC'
      ${profile}
      SRC
      )`)
      leaderboardEntries.push({
        name: this.vm.eval(`RubyWarrior::Profile.load("${gameDir}/.profile").warrior_name`).toJS(),
        score: this.vm.eval(`RubyWarrior::Profile.load("${gameDir}/.profile").score`).toJS(),
        elapsedMs: scoredTimeUnixMs - startTimeUnixMs
      })
    }
    leaderboardEntries.sort((a, b) => {
      // Sort by highest score first, then by fastest time as tiebreaker
      if (b.score !== a.score) {
        return b.score - a.score;
      } else {
        return a.elapsedMs - b.elapsedMs;
      }
    })
    leaderboardEntries = leaderboardEntries.slice(0, this.MAX_LEADERBOARD_ENTRIES)

    this.render(leaderboardEntries);
  }

  render(leaderboardEntries) {
    const tbody = document.getElementById(this.tbodyId);
    if (!tbody) return;

    tbody.innerHTML = ''; // Clear existing rows

    if (leaderboardEntries.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 3;
      cell.className = 'px-6 py-4 text-center text-sm text-gray-500 italic';
      cell.textContent = 'Finish a level to get your score on the leaderboard!';
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }

    for (let leaderboardEntry of leaderboardEntries) {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50';
      const nameCell = document.createElement('td');
      nameCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300';
      const isCurrentPlayer = this.currentPlayerName && leaderboardEntry.name === this.currentPlayerName;
      nameCell.textContent = isCurrentPlayer ? `${leaderboardEntry.name} (you)` : leaderboardEntry.name;
      const scoreCell = document.createElement('td');
      scoreCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300';
      scoreCell.textContent = leaderboardEntry.score;
      const timeCell = document.createElement('td');
      timeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
      timeCell.textContent = formatElapsedTime(leaderboardEntry.elapsedMs);
      row.appendChild(nameCell);
      row.appendChild(scoreCell);
      row.appendChild(timeCell);
      tbody.appendChild(row);
    }
  }
}

class Game {
  constructor(vm, name, levelNumber) {
    this.vm = vm;
    this.name = name;
    this.levelNumber = levelNumber;
    this.paused = false;
    this.stopped = false;
    this.pausePromise = undefined;
    this.pauseResolver = undefined;
    this.leaderboard = new Leaderboard(vm, 'leaderboard-body', name);
  }

  async start() {
    const loaded = await this.load();

    if (loaded) return;

    // This records the first time a game is started
    // Because SF Ruby warrior won't allow resuming paused games, we won't be accounting for pause time
    // Date.now() would work better for resuming paused games except that it is susceptible 
    // to system clock changes. Since we don't care about pausing, maybe use performance.now() instead
    this.startTimeUnixMs = Date.now();

    this.vm.eval(`
      RubyWarrior::Runner.new(%w[-d /game --no-epic], StdinStub.new(%w[y ${this.levelNumber} ${this.name}]), STDOUT).run
    `);

    const output = this.vm.$output.flush();

    // find the path to the game directory from the output
    const match = output.match(/See the (.+)\/README for instructions/);
    if (!match) {
      throw new Error("Failed to find game directory path");
    }

    this.gameDir = `/game/${match[1]}`;
  }

  get readme() {
    return this.vm.eval(`File.read("${this.gameDir}/README")`).toString();
  }

  get playerrb() {
    return this.vm.eval(`File.read("${this.gameDir}/player.rb")`).toString().trim();
  }

  get profile() {
    return this.vm.eval(`File.read("${this.gameDir}/.profile")`).toString();
  }

  updateLeaderboard() {
    this.leaderboard.update();
  }

  async play(input, output) {
    if (this.paused) return this.pauseResume();

    this.stopped = false;
    this.paused = false;

    window.$stdout = new OutputPrinter(output);
    window.$sleeper = this.sleeper = new Sleeper();

    let passed = false;

    try {
      this.vm.eval(`
        File.write("${this.gameDir}/player.rb", <<~'SRC'
  ${input}
        SRC
        )
        runner = RubyWarrior::Runner.new(%w[-d ${this.gameDir} --no-epic], StdinStub.new(%w[y y]), ExternalStdout.new)
        $game = runner.game
        # we control the game from the JS side
        $game.max_turns = 1
        runner.run
      `);

      let turnNum = 1;

      // Turn loop
      while(true) {
        let done = this.vm.eval(`$game.current_level.failed? || $game.current_level.passed?`).toJS();
        if (done) break;

        await window.$sleeper.sleep()

        if (this.stopped) return;

        if (this.pausePromise) await this.pausePromise;

        this.vm.eval(`$game.resume_current_level(${turnNum++})`)
      }

      passed = this.vm.eval(`$game.current_level.passed?`).toJS();

    } catch(error) {
      console.error(error);
      window.$stdout.print(error.message);
    }

    this.save();

    this.updateLeaderboard()

    return passed;
  }

  pauseResume() {
    if (this.paused) {
      this.paused = false;
      this.pauseResolver();
    } else {
      this.paused = true;
      this.pausePromise = new Promise(resolve => this.pauseResolver = resolve);
    }
  }

  interrupt() {
    if (this.paused) this.pauseResume();
    this.stopped = true;
  }

  async load() {
    const entry = getPlayerRecord(cacheKey(this.name, this.levelNumber));

    if (!entry) return false;

    const { gameDir, profile, playerrb, readme, startTimeUnixMs } = entry;

    this.gameDir = gameDir;
    this.startTimeUnixMs = startTimeUnixMs;

    this.vm.eval(`
FileUtils.mkdir_p("${this.gameDir}")
File.write("${this.gameDir}/.profile", <<~'SRC'
${profile}
SRC
)
File.write("${this.gameDir}/player.rb", <<~'SRC'
${playerrb}
SRC
)
File.write("${this.gameDir}/README", <<~'SRC'
${readme}
SRC
)
`);

    return true;
  }

  save() {
    const entry = {
      gameDir: this.gameDir,
      profile: this.profile,
      playerrb: this.playerrb,
      readme: this.readme,
      startTimeUnixMs: this.startTimeUnixMs,
      scoredTimeUnixMs: Date.now(),
    };

    setPlayerRecord(cacheKey(this.name, this.levelNumber), entry);
  }
}

export { Leaderboard };

export const start = async (vm, name, levelNumber) => {
  window.$vm = vm;
  const game = new Game(vm, name, levelNumber);
  await game.start();
  game.updateLeaderboard()
  return game;
};
