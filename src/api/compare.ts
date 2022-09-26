import { Command } from 'commander'
import fs from 'fs'
import { parse } from 'csv-parse'
import XLSX from 'xlsx'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const program = new Command()

program
  .option('-f, --file <file...>', 'file location of csv')
  .action((args) => {
    const { file } = args

    if (!file) {
      console.log('must provide file location')
      process.exit(1)
    }
  })
  .parse()

export const compare = () => {
  const { file } = program.opts()


  const filename = file[0]
  console.log(`Input file: ${path.join(__dirname, `input/${filename}`)}`)

  const results: any[] = []

  const mapColumnOne: Record<string, boolean> = {}
  const mapColumnTwo: Record<string, boolean> = {}

  fs.createReadStream(`input/${filename}`)
    .pipe(parse())
    .on('data', (data: string[]) => results.push(data))
    .on('end', async () => {
      const [header, ...rows] = results

      const columnOneHeader = header[0]
      const columnTwoHeader = header[1]

      const typedRows = rows as string[][]

      for (const [index, row] of Object.entries(typedRows)) {
        const idx = parseInt(index)
        const columnOne = typedRows[idx][0]
        const columnTwo = typedRows[idx][1]

        mapColumnOne[columnOne] = true
        mapColumnTwo[columnTwo] = true
      }

      const uniqueColumnOne: Set<string> = new Set()
      const uniqueColumnTwo: Set<string> = new Set()
      const existsInBoth: Set<string> = new Set()

      for (const [index, row] of Object.entries(typedRows)) {
        const idx = parseInt(index)
        const columnOne = typedRows[idx][0]
        const columnTwo = typedRows[idx][1]

        if (columnOne) {
          if (!mapColumnTwo[columnOne]) {
            uniqueColumnOne.add(columnOne)
          }

          if (mapColumnOne[columnOne] && mapColumnTwo[columnOne]) {
            existsInBoth.add(columnOne)
          }
        }

        if (columnTwo && !mapColumnOne[columnTwo]) {
          uniqueColumnTwo.add(columnTwo)
        }
      }
      
      const outputResults: any = []

      console.log({ missingFromColumnOne: uniqueColumnOne.size })
      console.log({ missingFromColumnTwo: uniqueColumnTwo.size })
      console.log({ existsInBoth: existsInBoth.size })
      
      const a = [...uniqueColumnOne]
      const b = [...uniqueColumnTwo]
      const c = [...existsInBoth]

      const largestLength = Math.max(a.length, b.length, c.length);

      for (let i = 0; i < largestLength; i += 1) {
        outputResults.push({
          [`Unique ${columnOneHeader}`]: a[i],
          [`Unique ${columnTwoHeader}`]: b[i],
          "Exists In Both": c[i]
        });
      }

      const outWB = XLSX.utils.book_new()
      const ws1 = XLSX.utils.json_to_sheet(outputResults)
      XLSX.utils.book_append_sheet(outWB, ws1, 'New Output')
      XLSX.writeFile(outWB,`output/${filename}.xlsx`)
    })
}

compare()
