import './index.css'

import * as d3 from 'd3'
import * as Plot from '@observablehq/plot'

const resolution = '1D'
const countback = '3000'

const desoHistoryUrl = `https://focus.xyz/api/v0/tokens/candlesticks/history?symbol=BC1YLbnP7rndL92x7DbLp6bkUpCgKmgoHgz7xEbwhgHTps3ZrXA6LtQ&resolution=${resolution}&countback=${countback}&quoteSymbol=BC1YLiwTN3DbkU8VmD7F7wXcRR1tFX6jDEkLyruHD2WsH3URomimxLX`
const focusHistoryUrl = `https://focus.xyz/api/v0/tokens/candlesticks/history?symbol=BC1YLjEayZDjAPitJJX4Boy7LsEfN3sWAkYb3hgE9kGBirztsc2re1N&resolution=${resolution}&countback=${countback}&quoteSymbol=BC1YLbnP7rndL92x7DbLp6bkUpCgKmgoHgz7xEbwhgHTps3ZrXA6LtQ`
const openfundHistoryUrl = `https://focus.xyz/api/v0/tokens/candlesticks/history?symbol=BC1YLj3zNA7hRAqBVkvsTeqw7oi4H6ogKiAFL1VXhZy6pYeZcZ6TDRY&resolution=${resolution}&countback=${countback}&quoteSymbol=BC1YLbnP7rndL92x7DbLp6bkUpCgKmgoHgz7xEbwhgHTps3ZrXA6LtQ`

let priceHistory = {}

function getHistoryData(url, token) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now()

    fetch(`${url}&to=${timestamp}`)
      .then((response) => {
        // console.log('RESPONSE', response)

        processJsonAndSave(response, token).then(() => {
          resolve(token)
        })
      })
      .catch((error) => {
        console.error('Error:', error)
        reject()
      })
  })
}

function processJsonAndSave(response, token) {
  return new Promise((resolve, reject) => {
    response.json().then((data) => {
      // console.log('Success:', data)

      priceHistory[token] = []

      data.forEach((element) => {
        element.timestamp = new Date(element.timestamp)

        if (element.time > 1738270800000) {
          priceHistory[token].push(element)
        }
      })

      resolve(token)
    })
  })
}

function createChart(token) {
  const plot = Plot.plot({
    inset: 6,
    width: 1500,
    height: 600,
    grid: true,
    y: {
      label: token
    },
    color: {
      domain: [-1, 0, 1],
      range: ['#e41a1c', '#000000', '#4daf4a']
    },
    marks: [
      Plot.ruleX(priceHistory[token], {
        x: 'timestamp',
        y1: 'low',
        y2: 'high'
      }),
      Plot.ruleX(priceHistory[token], {
        x: 'timestamp',
        y1: 'open',
        y2: 'close',
        stroke: (d) => Math.sign(d.close - d.open),
        strokeWidth: 4,
        strokeLinecap: 'square'
      })
    ]
  })

  const heading = document.querySelector(`#priceChart${token} h2`)
  heading.innerText =
    heading.innerText +
    ' ' +
    priceHistory[token][priceHistory[token].length - 1].close

  const priceChart = document.querySelector(`#priceChart${token} div`)
  console.log(priceChart)

  priceChart.innerText = ''
  priceChart.append(plot)
}

function createCombinedChart(token1, token2, element) {
  const token1Data = priceHistory[token1]
  const token2Data = priceHistory[token2]
  const combinedData = []

  token1Data.forEach((token1DataItem, index) => {
    combinedData.push({
      timestamp: token1DataItem.timestamp,
      close: token1DataItem.close / token2Data[index].close
    })
  })

  const plot = Plot.plot({
    inset: 6,
    width: 1500,
    height: 600,
    grid: true,
    y: {
      label: `${token1}/${token2}`
    },
    marks: [
      Plot.lineY(combinedData, {
        x: 'timestamp',
        y: 'close',
        stroke: '#4800ff',
        strokeWidth: 4
      })
    ]
  })

  const heading = document.querySelector(`#${element} h2`)
  heading.innerText =
    heading.innerText + ' ' + combinedData[combinedData.length - 1].close

  const priceChart = document.querySelector(`#${element} div`)
  priceChart.innerText = ''
  priceChart.append(plot)
}

const getDESO = getHistoryData(desoHistoryUrl, 'DESO').then((token) => {
  createChart(token)
})

const getFocus = getHistoryData(focusHistoryUrl, 'Focus').then((token) => {
  createChart(token)
})

const getOpenfund = getHistoryData(openfundHistoryUrl, 'Openfund').then(
  (token) => {
    createChart(token)
  }
)

Promise.all([getDESO, getFocus, getOpenfund]).then(() => {
  createCombinedChart('DESO', 'Focus', 'priceChartDESOFocus')
  createCombinedChart('DESO', 'Openfund', 'priceChartDESOOpenfund')
  createCombinedChart('Openfund', 'Focus', 'priceChartOpenfundFocus')
})
