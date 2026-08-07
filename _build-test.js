// Temporary harness: builds an instrumented copy of index.html that drives the
// wheel navigation and records where each step lands.
const fs = require("node:fs");

const probe = `
    <script>
      const log = [];
      const wheel = (deltaY) =>
        window.dispatchEvent(new WheelEvent("wheel", { deltaY, cancelable: true }));
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const note = (label) => {
        const slide = Math.round(window.scrollY / window.innerHeight * 100) / 100;
        log.push(label + "=" + slide);
      };

      (async () => {
        await wait(6500);
        note("start");
        wheel(120);
        await wait(1600);
        note("down1");
        wheel(120);
        await wait(1600);
        note("down2");
        wheel(120);
        await wait(1600);
        note("down3");
        wheel(-120);
        await wait(1600);
        note("up1");
        wheel(-120);
        await wait(1600);
        note("up2");
        const presented = [...document.querySelectorAll(".is-presented")]
          .map((node) => node.className.split(" ")[0])
          .join(",");
        document.body.dataset.log = log.join(" ") + " | presented: " + presented;
      })();
    </script>
`;

const html = fs
  .readFileSync("index.html", "utf8")
  .replace("</body>", probe + "  </body>");

fs.writeFileSync("_test.html", html);
console.log("built _test.html");
