import { Command } from 'commander'
import fs from 'fs'
import { parse } from 'csv-parse'
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

const program = new Command()

const INTERVAL_MS = 5000

const { TOKEN, URL } = process.env

program
  .option('-f, --file <file...>', 'file location of csv')
  .option('-b, --batch <divide...>', 'count rows to divide')
  .action((args) => {
    const { file, batch } = args

    if (!file) {
      console.log('must provide file location')
      process.exit(1)
    }

    if (!batch?.[0]) {
      console.log('must provide a valid number to divide rows into')
      process.exit(1)
    }
  })
  .parse()

// const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

export const runCsv = () => {
  const { file, batch } = program.opts()

  const path = file[0]
  const count = batch?.[0]

  const results: any[] = []

  fs.createReadStream(path)
    .pipe(parse())
    .on('data', (data: string[]) => results.push(data))
    .on('end', async () => {
      const [header, ...rows] = results

      const title = header[0]
      console.log('title: ', title)

      const allRows = rows.flat()

      console.log('rows count: ', allRows.length)
      
      console.log('starting backfill')

      if (count) {
        let currentResult: string[] = []

        for (let index = 0; index < allRows.length; index++) {
          currentResult.push(allRows[index])

          if ((index + 1) % parseInt(count) === 0) {
            console.log('Sending out current object ids', currentResult)
            
            try {
              const response = await axios.post(URL as string, [...currentResult], {
                headers: {
                  Authorization: `Bearer ${TOKEN}`,
                  'content-type': 'application/json',
                },
              })
              
              console.log('response status', response.status)
            } catch (error) {
              console.error('error', error)
              console.error('errored out at current result', currentResult)
              process.exit(1)
            }
             
            console.log('finished sending')
            
            // await delay(INTERVAL_MS);
            currentResult = []
          }
        }
      }

      
      console.log('completed backfill')
    })

}

runCsv()