const margin = { top: 20, right: 30, bottom: 70, left: 80 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const color = d3.scaleOrdinal(d3.schemeCategory10);

const dataUrl = "events-US-1990-2024.csv";

d3.csv(dataUrl).then(rawData => {
    const years = rawData.map(d => +d["Year"]);
    const eventTypes = Object.keys(rawData[0]).filter(key => key !== "Year");

    const data = rawData.map(d => {
        const year = +d["Year"];
        const events = {};
        eventTypes.forEach(type => {
            events[type] = +d[type] || 0;
        });
        return { year, ...events };
    });

    const checkboxContainer = d3.select("#checkboxContainer");
    eventTypes.forEach(type => {
        const legendItem = checkboxContainer.append("div").attr("class", "legend-item");

        legendItem.append("div")
            .attr("class", "legend-color")
            .style("background-color", color(type));

        legendItem.append("label")
            .text(type)
            .append("input")
            .attr("type", "checkbox")
            .attr("value", type)
            .on("change", updateChart);
    });

    const x = d3.scaleBand()
        .domain(years)
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 28]);

    const xAxis = d3.axisBottom(x).tickValues(years.filter((_, i) => i % 5 === 0));
    const yAxis = d3.axisLeft(y);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", "x-axis");

    svg.append("g")
        .attr("class", "y-axis");

    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Year");

    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Number of Events");

    function updateChart() {
        const selectedTypes = checkboxContainer.selectAll("input:checked")
            .nodes()
            .map(d => d.value);

        const filteredData = data.map(d => {
            const total = selectedTypes.reduce((sum, type) => sum + d[type], 0);
            return { year: d.year, total, ...d };
        });

        svg.select(".x-axis").call(xAxis);
        svg.select(".y-axis").call(yAxis);

        const stack = d3.stack().keys(selectedTypes);
        const series = stack(filteredData);

        const groups = svg.selectAll(".bar-group")
            .data(series, d => d.key);

        groups.enter()
            .append("g")
            .attr("class", "bar-group")
            .attr("fill", d => color(d.key))
            .merge(groups)
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => x(d.data.year))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth());

        groups.exit().remove();
    }

    updateChart();
});
