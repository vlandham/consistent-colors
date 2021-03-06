

var hash;
var values;
var colors;
var mapped;

var hashInput;
var valuesInput;
var colorsInput;
var outputContainer;
var outputTable;
var dotplot;

const COLORS = {
  default:[
    "hsl(58, 41%, 34%)",
    "hsl(298, 75%, 42%)",
    "hsl(137, 64%, 58%)",
    "hsl(328, 84%, 53%)",
    "hsl(120, 47%, 58%)",
    "hsl(311, 82%, 43%)",
    "hsl(98, 51%, 57%)",
    "hsl(313, 67%, 28%)",
    "hsl(64, 62%, 58%)",
    "hsl(284, 55%, 55%)",
    "hsl(37, 74%, 52%)",
    "hsl(304, 65%, 55%)",
    "hsl(127, 39%, 37%)",
    "hsl(340, 73%, 55%)",
    "hsl(165, 36%, 56%)",
    "hsl(359, 66%, 52%)",
    "hsl(269, 34%, 55%)",
    "hsl(39, 58%, 37%)",
    "hsl(297, 49%, 31%)",
    "hsl(77, 39%, 52%)",
    "hsl(321, 66%, 56%)",
    "hsl(37, 43%, 57%)",
    "hsl(304, 36%, 30%)",
    "hsl(14, 56%, 50%)",
    "hsl(309, 43%, 55%)",
    "hsl(15, 38%, 30%)",
    "hsl(333, 60%, 40%)",
    "hsl(345, 42%, 60%)",
    "hsl(335, 43%, 26%)",
    "hsl(345, 39%, 43%)"
  ],
  category20c:[
    "#3182bd",
    "#6baed6",
    "#9ecae1",
    "#c6dbef",
    "#e6550d",
    "#fd8d3c",
    "#fdae6b",
    "#fdd0a2",
    "#31a354",
    "#74c476",
    "#a1d99b",
    "#c7e9c0",
    "#756bb1",
    "#9e9ac8",
    "#bcbddc",
    "#dadaeb",
    "#636363",
    "#969696",
    "#bdbdbd",
    "#d9d9d9"
  ]
}

function createDotPlot() {

  var width = 800;
  var height = 300;
  var margin = {top: 20, right: 20, bottom: 20, left: 20};

  var radius = 6;
  var pad = 1;
  var svg = null;
  var g = null;

  var chart  = function(selection, data) {
    svg = d3.select(selection).append('svg')
      .attr('width', width + margin.right + margin.left)
      .attr('height', height + margin.top + margin.bottom);

    g = svg.append('g')
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
  }

  chart.update = function(data) {
    const maxDots = d3.max(data, (d) => d.values.length);
    console.log('update')
    console.log(maxDots)

    height = (radius * 2 + pad) * maxDots

    svg.attr('height', height + margin.top + margin.bottom);

    const dataKeys = data.map((d) => d.key)

    const xScale = d3.scaleBand()
      .domain(dataKeys)
      .range([0, width]);

    const keys = g.selectAll('.key')
      .data(dataKeys)
    const keysE = keys.enter()
      .append('text')
      .classed('key', true);

    keys.merge(keysE)
      .attr('x', (d) => xScale(d))
      .attr('y', height + margin.bottom )
      .attr('text-anchor', 'middle')
      .text((d) => d);

    keys.exit().remove();

    g.selectAll('.col').remove();

    const columns = g.selectAll('.col')
      .data(data, (d) => d.key)

    const columnsE = columns.enter()
      .append('g')
      .classed('col', true);

    columns.merge(columnsE)
      .attr('transform', (d) => `translate(${xScale(d.key)},${height})`)

    columns.exit().remove();

    const dots = columnsE.selectAll('.dot')
      .data((d) => d.values, (d) => d)

    const dotsE = dots.enter()
      .append('circle')
      .classed('dot', true)

    dots.merge(dotsE)
      .attr('r', radius)
      .attr('cx', 0)
      .attr('cy', (d, i) => (radius * 2 + pad) * -i)
      .attr('fill', (d) => mapped[d]);

    dots.exit().remove();
  }

  return chart;
}

function readInputs() {
  // read in values from text areas
  try {
    eval(`hash = ${hashInput.node().value.trim()}`);
    // clear error message if eval is successful.
    d3.select('.hash-function-error').text('');
  } catch (e) {
    d3.select('.hash-function-error').text(`ERROR: ${e.message}`);
  }
  values = valuesInput.node().value.trim().split('\n');
  colors = colorsInput.node().value.trim().split('\n');

  // compute mapping using hash function
  mapped = colorsFor(colors, values, hash);


  console.log('got hash =', hash);
  console.log('got values =', values);
  console.log('got colors =', colors);
  console.log('got mapped =', mapped);
}

/**
 * Updates color display table
 */
function updateTable(overlaps) {
  // remove existing rows
  const binding = outputTable.select('tbody').selectAll('tr').data(overlaps, d => d.key);

  const entering = binding.enter().append('tr').each(function (d) {
    var colorIndex = d.key;
    var values = d.values;
    var tr = d3.select(this);
    tr.append('td').classed('index-td', true);

    var coloredValues = values.map(value => `<span class='color-value-text' style='color: ${mapped[value]}'>${value}</span>`);
    tr.append('td').classed('values-td', true).html(coloredValues.join(''));
  });

  binding.merge(entering).each(function (d) {
    var colorIndex = d.key;
    var values = d.values;
    var tr = d3.select(this)
    var coloredValues = values.map(value => `<span class='color-value-text' style='background-color: ${mapped[value]};'>${value}</span>`);
    tr.select('.index-td').text(colorIndex).style('background', colors[colorIndex]);
    tr.select('.values-td').html(coloredValues.join(''));
  })

  binding.exit().remove();
}


/**
 * Reprocesses Text boxes and update displays
 */
function update() {
  // read in the values and compute the mapping
  readInputs();

  // get the data mapped from has index to values
  const overlaps = d3.nest()
    .key((d) => hash(d, colors.length))
    .entries(values);

  colors.forEach((color, i) => {
    if (!overlaps.find(overlap => +overlap.key === i)) {
      overlaps.push({ key: i, values: [] });
    }
  });

  overlaps.sort((a, b) => a.key - b.key);

  // output the mapping
  updateTable(overlaps);
  dotplot.update(overlaps);
}

function handleLinkClick(textarea, values) {

  textarea.node().value = values.join("\n");
  update();

  return false;
}

function addLinks(selection, textarea, links) {
  d3.select(selection).selectAll('.link')
    .data(d3.keys(links))
    .enter()
    .append('a')
    .attr("href", "#")
    .classed('link', true)
    .text((d) => d)
    .on('click', (d) => handleLinkClick(textarea, links[d]))

}

function setup() {
  // get the d3 selection of input elements
  hashInput = d3.select('.hash-function-input');
  valuesInput = d3.select('.data-values-input');
  colorsInput = d3.select('.colors-input');
  outputContainer = d3.select('.output');
  outputTable = outputContainer.select('table');

  dotplot = createDotPlot();
  dotplot('.dotplot-container');

  d3.selectAll('.input').on('input', update);

  addLinks('.color-links', colorsInput, COLORS)
  update();
}


/**
 * Given a sorted array of points with boundaries min and max, finds
 * the value in [min, max] that is farthest away from all values in points.
 */
function findFarthestPoint(points, min, max) {
  // initialize with distance from min boundary
  let maxDistance = points[0] - min;
  let maxEntryPoint = min;

  // see if distance between other points is bigger
  for (let i = 1; i < points.length; i++) {
    // divide by 2 since we care about distance to entry point which is halfway between
    let distance = (points[i] - points[i - 1]) / 2;
    if (distance > maxDistance) {
      maxDistance = distance;
      maxEntryPoint = points[i - 1] + (distance);
    }
  }
  // see if the distance to the max value is biggest
  if (max - points[points.length - 1] > maxDistance) {
    maxDistance = max - points[points.length - 1];
    maxEntryPoint = max;
  }

  return maxEntryPoint;
}

/**
 * Returns new array points where value is inserted in sorted order
 */
function insertPoint(points, value) {
  for (let i = 0; i < points.length; i++) {
    if (points[i] > value) {
      return points.slice(0, i).concat(value, points.slice(i));
    }
  }

  return points.concat(value);
}

/**
 * Helper function to insert a point at the farthest position from
 * other points.
 */
function insertPointAtFarthestPosition(points, min, max) {
  let value = findFarthestPoint(points, min, max);
  return insertPoint(points, value);
}

/**
 * Change brightness of overlapping colors.
 * @param {Array} colors Array of d3.color values
 * @param {Array} Array of overlap objects. Overlap created using d3.nest
 *  will have a `values` array attribute - an entry for each value in colors
 *  that are the same color. Each entry in values has a `index` attribute indicating
 *  the position in `colors` for that color.
 * @return {Array} Array of d3.color values altered so that none overlap.
 */
function varyColor(colors, overlaps) {
  overlaps.forEach((overlap) => {
    const length = overlap.values.length;
    if (length > 1) {
      const baseColor = colors[overlap.values[0].index];
      const minLightness = 0.2;
      const maxLightness = 0.8;
      const valuesToModify = overlap.values.slice(1);

      // initialize lightness values to the base
      let lightnessValues = [baseColor.l];

      // make the color the furthest lightness away from all the others that preceded it.
      valuesToModify.forEach((value, i) => {
        // find the farthest lightness value from the ones that preceded it
        const modifiedLightness = findFarthestPoint(lightnessValues, minLightness, maxLightness);

        // add this to the list of "used" lightness values (useful for the next iteration)
        lightnessValues = insertPoint(lightnessValues, modifiedLightness);

        // update the color for this value to have a modified lightness of the base color
        colors[value.index] = d3.hsl(baseColor.h, baseColor.s, modifiedLightness, baseColor.opacity);
      });
    }
  });

  return colors;
}

/**
 * Create an array of colors, one for each entry in values. Colors will not overlap,
 * but remain consistent based on `hashFunction`.
 * @param {Array} values Array to extract colors for.
 * @param {Function} valueAccessor Function to pull out the value from values with.
 *  defaults to identity function.
 * @param {Function} hashFunction Function to convert value to an index into color array.
 *  defaults to hashAsn which expects value to be ASN strings.
 * @return {Array} Array of Color strings in order of values.
 */
function extractColors(colors, values, hashFunction, valueAccessor = d => d) {
  const maxCount = colors.length;
  const indexes = values.map((v, i) => ({ index: i, hash: hashFunction(valueAccessor(v), maxCount) }));

  const mappedColors = indexes.map((h) => d3.hsl(d3.color(colors[h.hash])));

  // groups by hash value - so we can easily find duplicate colors.
  // alternative would be to rely on comparing d3.color values inside `varyColor`
  const overlaps = d3.nest()
    .key((d) => d.hash)
    .entries(indexes);

  const variedColors = varyColor(mappedColors, overlaps);

  return variedColors.map((c) => c.toString());
}

/**
 * Create an object of colors, with entries in `values` as attributes.
 * Each value is a color string. Colors will not overlap
 * but remain consistent based on `hashFunction`.
 * @param {Array} values Array to extract colors for.
 * @param {Function} valueAccessor Function to pull out the value from values with.
 *  defaults to identity function.
 * @param {Function} keyAccessor Function to pull out the key from the values.
 *  default to the valueAccessor.
 * @param {Function} hashFunction Function to convert value to an index into color array.
 *  defaults to hashAsn which expects value to be ASN strings.
 * @return {Object} With a key for each value in values.
 */
function colorsFor(colors, values = [], hashFunction, valueAccessor = d => d, keyAccessor) {
  keyAccessor = keyAccessor || valueAccessor;
  const mappedColors = extractColors(colors, values, hashFunction, valueAccessor);
  const colorMap = {};
  mappedColors.forEach((color, index) => {
    colorMap[keyAccessor(values[index])] = color;
  });

  return colorMap;
}













setup();
