import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js?v=2';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

projectsTitle.textContent = `${projects.length} Projects`;

let query = '';
let selectedIndex = -1;
let selectedYear = null;

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

let svg = d3.select('#projects-pie-plot');
let legend = d3.select('.legend');

function getSearchResults() {
    return projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });
}

function updateSelection() {
    svg.selectAll('path')
        .classed('selected', (d) =>
            selectedYear !== null &&
            String(d.data.label) === String(selectedYear)
        );

    legend.selectAll('li')
        .classed('selected', (d) =>
            selectedYear !== null &&
            String(d.label) === String(selectedYear)
        );
}

function updateProjects() {
    let filteredProjects = getSearchResults();

    if (selectedYear !== null) {
        filteredProjects = filteredProjects.filter((project) =>
            String(project.year) === String(selectedYear)
        );
    }

    renderProjects(filteredProjects, projectsContainer, 'h2');
}

function selectYear(year) {
    selectedYear =
        selectedYear !== null && String(selectedYear) === String(year)
            ? null
            : year;

    selectedIndex = -1;

    updateSelection();
    updateProjects();
}

function renderPieChart(projectsGiven) {
    let rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );

    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(data);

    selectedIndex = data.findIndex((d) =>
        selectedYear !== null &&
        String(d.label) === String(selectedYear)
    );

    svg.selectAll('path').remove();
    legend.selectAll('li').remove();

    arcData.forEach((d, idx) => {
        svg.append('path')
            .datum(d)
            .attr('d', arcGenerator(d))
            .attr('fill', colors(idx))
            .on('click', () => {
                selectYear(d.data.label);
            });
    });

    data.forEach((d, idx) => {
        legend.append('li')
            .datum(d)
            .attr('class', 'legend-item')
            .attr('style', `--color:${colors(idx)}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .style('cursor', 'pointer')
            .on('click', () => {
                selectYear(d.label);
            });
    });

    updateSelection();
}

renderPieChart(projects);
updateProjects();

searchInput.addEventListener('input', (event) => {
    query = event.target.value;

    let filteredProjects = getSearchResults();

    if (
        selectedYear !== null &&
        !filteredProjects.some((project) =>
            String(project.year) === String(selectedYear)
        )
    ) {
        selectedYear = null;
        selectedIndex = -1;
    }

    renderPieChart(filteredProjects);
    updateProjects();
});
