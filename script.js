//Margin for the charts
let margin = {top: 60, right: 30, bottom: 30, left: 60},
    width = 1000 - margin.left - margin.right,
    height = 550 - margin.top - margin.bottom;

//Array of JSON files
const ArrayOfFiles = ["2021.json", "2017.json", "2013.json", "2009.json", "2005.json", "2001.json", "1997.json", "1993.json"];
const Months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"];

//Drawing Line Charts
function drawLineChart() {
    for (let i = 0; i < ArrayOfFiles.length; i++) {
        let divId = "#year" + ArrayOfFiles[i].split(".")[0]
        let svg = d3.select("#lineChartsContainer").append("div").attr("class", "chart").attr("id", divId).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        d3.json("./assets/" + ArrayOfFiles[i],
            function (data) {
                let y0 = Math.max(-d3.min(data, function (d) {
                    return d.min
                }), d3.max(data, function (d) {
                    return d.max
                }))
                let x = d3.scaleTime()
                    .domain(d3.extent(data, function (d) {
                        return d3.timeParse("%d.%m.%Y")(d.date);
                    }))
                    .range([0, width]);
                svg.append("g")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x));

                let y = d3.scaleLinear()
                    .domain([-y0 - 10, y0 + 30])
                    .range([height, 0]);
                svg.append("g")
                    .call(d3.axisLeft(y));

                svg.append("path")
                    .datum(data)
                    .attr("fill", "none")
                    .attr("stroke", "#1e81b0")
                    .attr("stroke-width", 2)
                    .attr("d", d3.line()
                        .x(function (d) {
                            return x(d3.timeParse("%d.%m.%Y")(d.date))
                        })
                        .y(function (d) {
                            return y(d.max)
                        }))


                svg.append("path")
                    .datum(data)
                    .attr("fill", "none")
                    .attr("class", "line")
                    .attr("stroke", "#063970")
                    .attr("stroke-width", 2)
                    .attr("d", d3.line()
                        .x(function (d) {
                            return x(d3.timeParse("%d.%m.%Y")(d.date))
                        })
                        .y(function (d) {
                            return y(d.min)
                        })
                    )
                svg.append("g")
                    .selectAll("dot")
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr("cx", function (d) {
                        return x(d3.timeParse("%d.%m.%Y")(d.date))
                    })
                    .attr("cy", function (d) {
                        return y((Number(d.min) + Number(d.max)) / 2)
                    })
                    .attr("r", 1.5)
                    .attr("fill", "#e28743")

                svg.append("text")
                    .attr("class", "x label")
                    .attr("text-anchor", "end")
                    .attr("x", width)
                    .attr("y", height - 6)
                    .text("Months");

                svg.append("text")
                    .attr("class", "y label")
                    .attr("text-anchor", "end")
                    .attr("y", 6)
                    .attr("dy", ".75em")
                    .attr("transform", "rotate(-90)")
                    .text("Temp");

                svg.append("text")
                    .attr("class", "chartTitle")
                    .attr("x", (width / 2))
                    .attr("y", 10 - (margin.top / 2))
                    .text("Year " + ArrayOfFiles[i].split(".")[0]);
            });
    }
}

//Drawing RidgeLine
function drawRidgeLine() {
    let svg = d3.select("#ridgeLine").append("div").attr("class", "chart").attr("id", "year2021").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    d3.json("./assets/2021.json",
        function (data) {
            let x0 = Math.max(-d3.min(data, function (d) {
                return d.min
            }), d3.max(data, function (d) {
                return d.max
            }))
            let categories = Months;
            let n = categories.length;

            // Add X axis
            let x = d3.scaleLinear()
                .domain([-20, 60])
                .range([0, width]);
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));

            // Create a Y scale for densities
            let y = d3.scaleLinear()
                .domain([0, 0.9])
                .range([height, 0]);

            // Create the Y axis for names
            let yName = d3.scaleBand()
                .domain(categories)
                .range([0, height])
                .paddingInner(1);
            svg.append("g")
                .call(d3.axisLeft(yName));

            let kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40));
            let allDensity1 = [];
            let allDensity2 = [];
            let key;
            let density;
            for (let i = 0; i < n; i++) {
                key = categories[i]
                density = kde(data.map(function (d) {
                    return Number(d.max);
                }))
                allDensity1.push({key: key, density: density})
            }

            for (let i = 0; i < n; i++) {
                key = categories[i]
                density = kde(data.map(function (d) {
                    return Number(d.min);
                }))
                allDensity2.push({key: key, density: density})
            }

            // Add areas
            svg.selectAll("areas")
                .data(allDensity1)
                .enter()
                .append("path")
                .attr("transform", function (d) {
                    return ("translate(0," + (yName(d.key) - height) + ")")
                })
                .datum(function (d) {
                    return (d.density)
                })
                .attr("fill", "#1e81b0")
                .attr("stroke", "#000")
                .attr("stroke-width", 1)
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(function (d) {
                        return x(d[0]);
                    })
                    .y(function (d) {
                        return y(d[1]);
                    })
                )

            svg.selectAll("areas")
                .data(allDensity2)
                .enter()
                .append("path")
                .attr("transform", function (d) {
                    return ("translate(0," + (yName(d.key) - height) + ")")
                })
                .datum(function (d) {
                    return (d.density)
                })
                .attr("fill", "#063970")
                .attr("stroke", "#000")
                .attr("stroke-width", 1)
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(function (d) {
                        return x(d[0]);
                    })
                    .y(function (d) {
                        return y(d[1]);
                    })
                )
            svg.append("text")
                .attr("class", "chartTitle")
                .attr("x", (width / 2))
                .attr("y", -5 - (margin.top / 2))
                .text("Year 2021");
        })

    function kernelDensityEstimator(kernel, X) {
        return function (V) {
            return X.map(function (x) {
                return [x, d3.mean(V, function (v) {
                    return kernel(x - v);
                })];
            });
        };
    }

    function kernelEpanechnikov(k) {
        return function (v) {
            return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
        };
    }

}

function RadarChart() {
    let myData = [];
    for (let i = 0; i < ArrayOfFiles.length; i++) {
        let year = ArrayOfFiles[i].split(".")[0];
        let monthTemps = new Map();
        let divId = "#y" + ArrayOfFiles[i].split(".")[0]
        let svg = d3.select("#radarChart").append("div").attr("class", "chart").attr("id", divId).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        d3.json("./assets/" + ArrayOfFiles[i],
            function (data) {
                let mins = [];
                let maxs = [];
                data.forEach((d) => {
                    if (d.date.split(".")[1] === "01") {
                        mins = []
                        maxs = []
                        mins.push(Number(d.min))
                        maxs.push(Number(d.max))
                        monthTemps.set("January", {
                            min: Math.min(mins),
                            max: Math.max(maxs),
                            mean: (Number((Math.min(mins) + Math.max(maxs)) / 2))
                        })
                    }
                    if (d.date.split(".")[1] === "02") {
                        mins = []
                        maxs = []
                        mins.push(Number(d.min))
                        maxs.push(Number(d.max))
                        monthTemps.set("February", {
                            min: Math.min(mins),
                            max: Math.max(maxs),
                            mean: (Number((Math.min(mins) + Math.max(maxs)) / 2))
                        })
                    }
                    if (d.date.split(".")[1] === "03") {
                        mins = []
                        maxs = []
                        mins.push(Number(d.min))
                        maxs.push(Number(d.max))
                        monthTemps.set("March", {
                            min: Math.min(mins),
                            max: Math.max(maxs),
                            mean: (Number((Math.min(mins) + Math.max(maxs)) / 2))
                        })
                    }
                    if (d.date.split(".")[1] === "04") {
                        mins = []
                        maxs = []
                        mins.push(Number(d.min))
                        maxs.push(Number(d.max))
                        monthTemps.set("April", {
                            min: Math.min(mins),
                            max: Math.max(maxs),
                            mean: (Number((Math.min(mins) + Math.max(maxs)) / 2))
                        })
                    }
                    if (d.date.split(".")[1] === "05") {
                        mins = []
                        maxs = []
                        mins.push(Number(d.min))
                        maxs.push(Number(d.max))
                        monthTemps.set("May", {
                            min: Math.min(mins),
                            max: Math.max(maxs),
                            mean: (Number((Math.min(mins) + Math.max(maxs)) / 2))
                        })
                    }
                    if (d.date.split(".")[1] === "06") {
                        mins = []
                        maxs = []
                        mins.push(Number(d.min))
                        maxs.push(Number(d.max))
                        monthTemps.set("June", {
                            min: Math.min(mins),
                            max: Math.max(maxs),
                            mean: (Number((Math.min(mins) + Math.max(maxs)) / 2))
                        })
                    }
                    if (d.date.split(".")[1] === "07") {
                        mins = []
                        maxs = []
                        mins.push(Number(d.min))
                        maxs.push(Number(d.max))
                        monthTemps.set("July", {
                            min: Math.min(mins),
                            max: Math.max(maxs),
                            mean: (Number((Math.min(mins) + Math.max(maxs)) / 2))
                        })
                    }
                    if (d.date.split(".")[1] === "08") {
                        mins = []
                        maxs = []
                        mins.push(Number(d.min))
                        maxs.push(Number(d.max))
                        monthTemps.set("August", {
                            min: Math.min(mins),
                            max: Math.max(maxs),
                            mean: (Number((Math.min(mins) + Math.max(maxs)) / 2))
                        })
                    }
                    if (d.date.split(".")[1] === "09") {
                        mins = []
                        maxs = []
                        mins.push(Number(d.min))
                        maxs.push(Number(d.max))
                        monthTemps.set("September", {
                            min: Math.min(mins),
                            max: Math.max(maxs),
                            mean: (Number((Math.min(mins) + Math.max(maxs)) / 2))
                        })
                    }
                    if (d.date.split(".")[1] === "10") {
                        mins = []
                        maxs = []
                        mins.push(Number(d.min))
                        maxs.push(Number(d.max))
                        monthTemps.set("October", {
                            min: Math.min(mins),
                            max: Math.max(maxs),
                            mean: (Number((Math.min(mins) + Math.max(maxs)) / 2))
                        })
                    }
                    if (d.date.split(".")[1] === "11") {
                        mins = []
                        maxs = []
                        mins.push(Number(d.min))
                        maxs.push(Number(d.max))
                        monthTemps.set("November", {
                            min: Math.min(mins),
                            max: Math.max(maxs),
                            mean: (Number((Math.min(mins) + Math.max(maxs)) / 2))
                        })
                    }
                    if (d.date.split(".")[1] === "12") {
                        mins = []
                        maxs = []
                        mins.push(Number(d.min))
                        maxs.push(Number(d.max))
                        monthTemps.set("December", {
                            min: Math.min(mins),
                            max: Math.max(maxs),
                            mean: (Number((Math.min(mins) + Math.max(maxs)) / 2))
                        })
                    }

                })
                myData.push({year: year, value: monthTemps})
            })
        var color = d3.scaleOrdinal()
            .range(["#EDC951", "#CC333F", "#00A0B0"]);

        var radarChartOptions = {
            w: width,
            h: height,
            margin: margin,
            maxValue: 0.5,
            levels: 5,
            roundStrokes: true,
            color: color
        };
        //Call function to draw the Radar chart
    }
    RadarChart(".radarChart", myData, radarChartOptions);


}

drawLineChart()
// RadarChart()
drawRidgeLine();
