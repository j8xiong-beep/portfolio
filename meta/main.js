import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];

      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: 'https://github.com/j8xiong-beep/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        configurable: true,
        writable: true,
        enumerable: false,
      });

      return ret;
    });
}


function renderCommitInfo(data, commits) {
    const container = d3.select('#stats');
    container.selectAll('*').remove();
  
    const dl = container
      .append('dl')
      .attr('class', 'stats');
  
    dl.append('dt')
      .html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd')
      .text(data.length);
  
    dl.append('dt')
      .text('Total commits');
    dl.append('dd')
      .text(commits.length);

    const totalFiles = d3.group(data, d => d.file).size;
  
    dl.append('dt')
      .text('Files');
    dl.append('dd')
      .text(totalFiles);
  
    const maxDepth = d3.max(data, d => d.depth);
  
    dl.append('dt')
      .text('Max depth');
    dl.append('dd')
      .text(maxDepth);
  
    const longestLine = d3.max(data, d => d.length);
  
    dl.append('dt')
      .text('Longest line');
    dl.append('dd')
      .text(longestLine);
  
    const fileLengths = d3.rollups(
      data,
      v => d3.max(v, d => d.line),
      d => d.file
    );
  
    const maxFileLength = d3.max(fileLengths, d => d[1]);
  
    dl.append('dt')
      .text('Max file length');
    dl.append('dd')
      .text(maxFileLength);
  }


  function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');
  
    if (!commit || Object.keys(commit).length === 0) {
      return;
    }
  
    link.href = commit.url;
    link.textContent = commit.id;
  
    date.textContent = commit.datetime.toLocaleString('en', {
      dateStyle: 'full',
    });
  
    time.textContent = commit.time;
    author.textContent = commit.author;
    lines.textContent = commit.totalLines;
  }
  
  function renderScatterPlot(data, commits) {
    // Chart dimensions
    const width = 1000;
    const height = 600;
  
    // Step 2.2: Margins
    const margin = {
      top: 10,
      right: 10,
      bottom: 30,
      left: 20
    };
  
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom
    };
  
    // Create SVG
    const svg = d3
      .select('#chart')
      .selectAll('svg')
      .data([null])
      .join('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');
  
    // X scale: commit dates
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    // Y scale: time of day
    const yScale = d3
      .scaleLinear()
      .domain([0, 24])
      .range([usableArea.top, usableArea.bottom]);
  
    // Create axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(d3.timeDay.every(3))
      .tickFormat(d3.timeFormat('%a %d'));
  
    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat(
        d => String(d % 24).padStart(2, '0') + ':00'
      );
  
    
  // Step 2.3: Add horizontal grid lines
  const gridlines = svg
  .append('g')
  .attr('class', 'gridlines')
  .attr('transform', `translate(${usableArea.left}, 0)`);

gridlines.call(
  d3.axisLeft(yScale)
    .tickFormat('')
    .tickSize(-usableArea.width)
);

    // Add X axis
    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(xAxis);
  
    // Add Y axis
    svg
      .append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(yAxis);
  
    // Create dots group
    const dots = svg
      .append('g')
      .attr('class', 'dots');
  
    // Draw circles for commits
    dots
      .selectAll('circle')
      .data(commits)
      .join('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', 5)
      .attr('fill', 'steelblue')
      .on('mouseenter', (event, commit) => {
        renderTooltipContent(commit);
    })
    .on('mouseleave', () => {
  // Step 3.1: Tooltip remains visible for now.
});

  }  

let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

console.log(commits);

