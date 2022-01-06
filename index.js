const fs = require('fs');
const FILE_NAME = 'keywordsData.csv';
const puppeteer = require('puppeteer');
const keywords = require('./mainKeywords');

// const keywords = [
//   'glutenfree',
//   'gluten free bread',
//   'gluten free diet',
//   'gluten free foods',
//   'gluten free near me',
//   'gluten free oreos',
//   'gluten free bakery near me',
//   'gluten free flour',
// ];

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

const chunk = keywords.slice(1254);

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  let index = 1;
  await asyncForEach(chunk, async (keyword) => {
    let autoSuggestionsKeywordsArr = [];
    let questionsArr = [];
    let lsiArr = [];

    console.log(index++);

    await page.goto(`https://google.com/search?q=${keyword}`);
    // $inputField = await page.$('input[type="text"]');
    await page.click('input[type="text"]');

    await page.waitForTimeout(100);

    // await page.goto('https://google.com');
    // TODO - Loop for all keywords starts here
    // const $inputField = await page.$('input[type="text"]');
    // await $inputField.type(keyword, { delay: 120 }); // Types slower, like a user
    // await $inputField.type(keyword); // Types slower, like a user

    // Start finding and storing autosuggestions
    await page.waitForTimeout(150).then(async () => {
      const suggestionsKeywords = await page.$$eval(
        '.sbct .wM6W7d span',
        (sugs) => sugs.map((s) => s.textContent)
      );

      autoSuggestionsKeywordsArr = [...suggestionsKeywords];
      // Found and stored autosuggestions

      // Hit enter to load the page

      // await page.keyboard.press('Enter');

      // Start:Find and store questions
      // await page.goto(`https://google.com/search?q=${keyword}`);

      const questions = await page.$$eval(
        '.related-question-pair .iDjcJe span',
        (qus) => qus.map((q) => q.textContent)
      );

      questionsArr = [...questions];
      // console.log('Questions: ', questionsArr);
      // End:Find and store questions

      // Start:Find and store LSI
      const lsiResults = await page.$$eval('#bres .s75CSd b', (lsis) =>
        lsis.map((l) => l.textContent)
      );
      lsiArr = [...lsiResults];
      // console.log('LSI: ', lsiArr);
      // StarEnd:Find and store LSI

      // Start: Create .csv row
      const row = [
        keyword,
        autoSuggestionsKeywordsArr.join('; '),
        questionsArr.join('; '),
        lsiArr.join('; '),
      ];

      // console.log(row);

      let newLine = row.join(', ') + '\n';
      fs.appendFile(FILE_NAME, newLine, (err) => {
        return console.log(err);
      });
      // End: Create .csv row
    });
  });
  console.log('Done');

  await browser.close();
})();
