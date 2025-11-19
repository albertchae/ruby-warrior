import { RubyVM } from "@ruby/wasm-wasi";
import {
  PreopenDirectory,
  File,
  WASI,
  OpenFile,
  ConsoleStdout,
} from "@bjorn3/browser_wasi_shim";

import appURL from "./ruby-warrior-web.wasm?url";

export const gameDir = new PreopenDirectory("/game", new Map());

export default async function initVM() {
  console.log("Loading Wasm app...");
  const module = await WebAssembly.compileStreaming(fetch(appURL));
  console.log("Wasm app loaded");

  const output = [];
  output.flush = function () {
    return this.splice(0, this.length).join("\n");
  };

  const setStdout = function (val) {
    console.log(val);
    output.push(val);
  };

  const setStderr = function (val) {
    console.warn(val);
    output.push(`[warn] ${val}`);
  };

  const fds = [
    new OpenFile(new File([])),
    ConsoleStdout.lineBuffered(setStdout),
    ConsoleStdout.lineBuffered(setStderr),
    gameDir,
  ];
  const wasi = new WASI([], [], fds, { debug: false });
  const { vm, instance } = await RubyVM.instantiateModule({
    module, wasip1: wasi
  });

  console.log("Initializing Wasm app...");
  wasi.initialize(instance);
  vm.initialize();
  vm.$output = output;

  vm.eval(`
    require "/bundle/setup"
    require "js"
    require "/app/lib/ruby_warrior"

    class StdinStub
      attr_reader :input
      def initialize(input) = @input = input

      def gets
        input.shift || ""
      end
    end

    module Kernel
      def sleep(val)
        JS.global[:$sleeper].nextSleep(val)
      end
    end

    class ExternalStdout
      def write(val)
        JS.global[:$stdout].print(val)
      end

      def print(val)
        JS.global[:$stdout].print(val)
      end

      def puts(val)
        JS.global[:$stdout].puts(val)
      end

      def flush; end # noop
    end

    $stdout = ExternalStdout.new
  `);

  console.log("Wasm app initialized");

  return vm;
}
