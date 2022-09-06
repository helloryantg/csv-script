import { Command } from 'commander'
import fs from 'fs'
import { parse } from 'csv-parse'

const program = new Command()

program
  .option('-f, --file <file...>', 'file location of csv')
  .option('-d, --divideByCount <divide...>', 'count rows to divide')
  .action((args) => {
    const { file, divideByCount } = args

    if (!file) {
      console.log('must provide file location')
      process.exit(1)
    }
    
    if (divideByCount?.[0]) {
      console.log(parseInt(divideByCount[0]))
      if (!Number.isInteger(parseInt(divideByCount[0]))) {
        
        console.log('must provide a valid number')
        process.exit(1)
      }
    }
  })
  .parse()

export const runCsv = () => {
  const { file, divideByCount } = program.opts()
  
  const path = file[0]
  const count = divideByCount?.[0]

  const results: any[] = [];
  
  const dividedResults: string[][] = []

  fs.createReadStream(path)
    .pipe(parse())
    .on('data', (data: string[]) => results.push(data))
    .on('end', () => {
      const [header, ...rows] = results
      
      const title = header[0]
      console.log('title', title)
      
      const allRows = rows.flat()
      
      if (count) {
        let currentResult: string[] = []
        
        allRows.forEach((rows,  index) => {

          currentResult.push(rows)
          
          if ((index + 1) % parseInt(count) === 0) {
            console.log('current result', currentResult)
            dividedResults.push(currentResult)
            currentResult = []
          }
        })
      }
      console.log(dividedResults)
    });
  
}

runCsv()