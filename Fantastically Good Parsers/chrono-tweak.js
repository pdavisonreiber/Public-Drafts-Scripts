// Chrono tweak to assume dates given are in the future

function isPastDate({year, month, day}, ref) {
  let refDay = ref.getDate()
  let refMonth = ref.getMonth() + 1
  let refYear = ref.getFullYear()
  if(refYear > year) {
    return true
  }
  if(refMonth > month){
    return true
  }
  if(refDay > day){
    return true
  }
  return false
}

var PreferFutureNextWeek = new chrono.Refiner()
PreferFutureNextWeek.refine = function(text, results) {
  results.forEach(function(result) {
    if (result.start.isCertain('weekday') && !result.start.isCertain('day')) {
      if(isPastDate(result.start.impliedValues, result.ref)) {
        result.start.imply('day', result.start.impliedValues.day + 7)
      }
    }
  })
  return results
}

chrono.casual.refiners.push(PreferFutureNextWeek)
chrono.strict.refiners.push(PreferFutureNextWeek)
