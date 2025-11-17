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
  constructor(vm, tbodyId = 'leaderboard-body', currentPlayerName = null) {
    this.vm = vm;
    this.tbodyId = tbodyId;
    this.currentPlayerName = currentPlayerName;
  }

  update() {
    let playerRecords = []

    for (let i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i)
      if (!key.startsWith('rw-')) continue;

      let entry = localStorage.getItem(key)
      const { gameDir, profile } = JSON.parse(entry);
      playerRecords.push([gameDir, profile]);
    }

    let leaderboardEntries = []

    for (let [gameDir, profile] of playerRecords) {
      this.vm.eval(`
      FileUtils.mkdir_p("${gameDir}")
      File.write("${gameDir}/.profile", <<~'SRC'
      ${profile}
      SRC
      )`)
      leaderboardEntries.push({
        name: this.vm.eval(`RubyWarrior::Profile.load("${gameDir}/.profile").warrior_name`).toJS(),
        score: this.vm.eval(`RubyWarrior::Profile.load("${gameDir}/.profile").score`).toJS()
      })
    }
    leaderboardEntries.sort((a, b) => b.score - a.score) // sort by highest score first

    this.render(leaderboardEntries);
  }

  render(leaderboardEntries) {
    const tbody = document.getElementById(this.tbodyId);
    if (!tbody) return;

    tbody.innerHTML = ''; // Clear existing rows

    if (leaderboardEntries.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 2;
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
      scoreCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
      scoreCell.textContent = leaderboardEntry.score;
      row.appendChild(nameCell);
      row.appendChild(scoreCell);
      tbody.appendChild(row);
    }
  }
}

class Game {
  constructor(vm, name, skillLevel) {
    this.vm = vm;
    this.name = name;
    this.skillLevel = skillLevel;
    this.paused = false;
    this.stopped = false;
    this.pausePromise = undefined;
    this.pauseResolver = undefined;
    this.leaderboard = new Leaderboard(vm, 'leaderboard-body', name);
  }

  async start() {
    const loaded = await this.load();

    if (loaded) return;

    this.vm.eval(`
      RubyWarrior::Runner.new(%w[-d /game --no-epic], StdinStub.new(%w[y ${this.skillLevel} ${this.name}]), STDOUT).run
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
    const entry = localStorage.getItem(this.cacheKey);

    if (!entry) return false;

    const { gameDir, profile, playerrb, readme } = JSON.parse(entry);

    this.gameDir = gameDir;

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
    };

    localStorage.setItem(this.cacheKey, JSON.stringify(entry));
  }

  get cacheKey() {
    return `rw-${this.encodedName}-${this.skillLevel}`;
  }

  get encodedName() {
    return this.name.replace(/\s/, "-");
  }
}

export { Leaderboard };

export const start = async (vm, name, skillLevel) => {
  window.$vm = vm;
  const game = new Game(vm, name, skillLevel);
  await game.start();
  game.updateLeaderboard()
  return game;
};
