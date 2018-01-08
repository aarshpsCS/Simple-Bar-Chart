module powerbi.extensibility.visual {

    interface BarChartViewModel {
        dataPoints: BarChartDataPoint[];
        dataMax: number;
        settings: BarChartSettings;
    };

    interface BarChartDataPoint {
        value: PrimitiveValue;
        category: string;
        color: string;
        selectionId: powerbi.visuals.ISelectionId;
    };

    interface BarChartSettings {
        enableAxis: {
            show: boolean;
        };

        generalView: {
            opacity: number;
            showHelpLink: boolean;
        };
    }

    function visualTransform(options: VisualUpdateOptions, host: IVisualHost): BarChartViewModel {
        let dataViews = options.dataViews;
        let defaultSettings: BarChartSettings = {
            enableAxis: {
                show: false,
            },
            generalView: {
                opacity: 100,
                showHelpLink: false
            }
        };
        let viewModel: BarChartViewModel = {
            dataPoints: [],
            dataMax: 0,
            settings: <BarChartSettings>{}
        };

        if (!dataViews
            || !dataViews[0]
            || !dataViews[0].categorical
            || !dataViews[0].categorical.categories
            || !dataViews[0].categorical.categories[0].source
            || !dataViews[0].categorical.values)
            return viewModel;

        let categorical = dataViews[0].categorical;
        let category = categorical.categories[0];
        let dataValue = categorical.values[0];

        let barChartDataPoints: BarChartDataPoint[] = [];
        let dataMax: number;

        let colorPalette: IColorPalette = host.colorPalette;
        let objects = dataViews[0].metadata.objects;
        let barChartSettings: BarChartSettings = {
            enableAxis: {
                show: getValue<boolean>(objects, 'enableAxis', 'show', defaultSettings.enableAxis.show),
            },
            generalView: {
                opacity: getValue<number>(objects, 'generalView', 'opacity', defaultSettings.generalView.opacity),
                showHelpLink: getValue<boolean>(objects, 'generalView', 'showHelpLink', defaultSettings.generalView.showHelpLink),
            }
        };
        for (let i = 0, len = Math.max(category.values.length, dataValue.values.length); i < len; i++) {
            let defaultColor: Fill = {
                solid: {
                    color: colorPalette.getColor(category.values[i] + '').value
                }
            };

            barChartDataPoints.push({
                category: category.values[i] + '',
                value: dataValue.values[i],
                color: getCategoricalObjectValue<Fill>(category, i, 'colorSelector', 'fill', defaultColor).solid.color,
                selectionId: host.createSelectionIdBuilder()
                    .withCategory(category, i)
                    .createSelectionId()
            });
        }
        dataMax = <number>dataValue.maxLocal;

        return {
            dataPoints: barChartDataPoints,
            dataMax: dataMax,
            settings: barChartSettings,
        };
    }

    export class Visual implements IVisual {
        private host: IVisualHost;
        private selectionManager: ISelectionManager;
        // private tooltipServiceWrapper: ITooltipServiceWrapper;
        private svg: d3.Selection<SVGAElement>;
        private locale: string;
        private barContainer: d3.Selection<SVGElement>;
        private xAxis: d3.Selection<SVGElement>;
        private helpLinkElement: Element;
        private barChartSettings: BarChartSettings;
        private barDataPoints: BarChartDataPoint[];

        private createHelpLinkElement(): Element {
            let linkElement = document.createElement("a");
            linkElement.textContent = "?";
            linkElement.setAttribute("title", "Open documentation");
            linkElement.setAttribute("class", "helpLink");
            linkElement.addEventListener("click", () => {
                this.host.launchUrl("https://github.com/Microsoft/PowerBI-visuals/blob/master/Readme.md#developing-your-first-powerbi-visual");
            });
            return linkElement;
        };

        static Config = {
            xScalePadding: 0.1,
            solidOpacity: 1,
            transparentOpacity: 0.5,
            margins: {
                top: 0,
                right: 0,
                bottom: 25,
                left: 30,
            },
            xAxisFontMultiplier: 0.04,
        };

        // private getTooltipData(value: any): VisualTooltipDataItem[] {
        //     let language = getLocalizedString(this.locale, "LanguageKey");
        //     return [{
        //         displayName: value.category,
        //         value: value.value.toString(),
        //         color: value.color,
        //         header: language && "displayed language " + language
        //     }];
        // }

        // private target: HTMLElement;
        // private updateCount: number;
        // private settings: VisualSettings;
        // private textNode: Text;

        constructor(options: VisualConstructorOptions) {

            let new_p: HTMLElement = document.createElement('p');
            new_p.id = "8001";
            new_p.innerHTML = "Test element";
            options.element.appendChild(new_p);
            console.log(options.element);

            this.host = options.host;
            this.selectionManager = options.host.createSelectionManager();
            // this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);

            let svg = this.svg = d3.select(options.element)
                .append('svg')
                .classed('barChart', true);

            this.locale = options.host.locale;

            this.barContainer = svg.append('g')
                .classed('barContainer', true);

            this.xAxis = svg.append('g')
                .classed('xAxis', true);

            this.helpLinkElement = this.createHelpLinkElement();
            options.element.appendChild(this.helpLinkElement);

            // console.log('Visual constructor', options);
            // this.target = options.element;
            // this.updateCount = 0;
            // if (typeof document !== "undefined") {
            //     const new_p: HTMLElement = document.createElement("p");
            //     new_p.appendChild(document.createTextNode("Update count:"));
            //     const new_em: HTMLElement = document.createElement("em");
            //     this.textNode = document.createTextNode(this.updateCount.toString());
            //     new_em.appendChild(this.textNode);
            //     new_p.appendChild(new_em);
            //     this.target.appendChild(new_p);
            // }
        }

        public update(options: VisualUpdateOptions) {

            // let a = d3.select("#8001");
            // a.transition();
            // let testElement = d3.select("#8001");
            // console.log("Testing : ", testElement.empty());

            let viewModel: BarChartViewModel = visualTransform(options, this.host);
            let settings = this.barChartSettings = viewModel.settings;
            this.barDataPoints = viewModel.dataPoints;

            let width = options.viewport.width;
            let height = options.viewport.height;

            this.svg.attr({
                width: width,
                height: height
            });

            if (settings.enableAxis.show) {
                let margins = Visual.Config.margins;
                height -= margins.bottom;
            }

            if (settings.generalView.showHelpLink) {
                this.helpLinkElement.classList.remove("hidden");
            } else {
                this.helpLinkElement.classList.add("hidden");
            }

            this.xAxis.style({
                'font-size': d3.min([height, width]) * Visual.Config.xAxisFontMultiplier,
            });

            let yScale = d3.scale.linear()
                .domain([0, viewModel.dataMax])
                .range([height, 0]);

            let xScale = d3.scale.ordinal()
                .domain(viewModel.dataPoints.map(d => d.category))
                .rangeRoundBands([0, width], Visual.Config.xScalePadding, 0.2);

            let xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom');

            this.xAxis.attr('transform', 'translate(0, ' + height + ')')
                .call(xAxis);

            let bars = this.barContainer.selectAll('.bar').data(viewModel.dataPoints);
            bars.enter()
                .append('rect')
                .classed('bar', true);

            bars.attr({
                width: xScale.rangeBand(),
                height: d => height - yScale(<number>d.value),
                y: d => yScale(<number>d.value),
                x: d => xScale(d.category),
                fill: d => d.color,
                'fill-opacity': viewModel.settings.generalView.opacity / 100
            });

            // this.tooltipServiceWrapper.addTooltip(this.barContainer.selectAll('.bar'),
            //     (tooltipEvent: TooltipEventArgs<number>) => this.getTooltipData(tooltipEvent.data),
            //     (tooltipEvent: TooltipEventArgs<number>) => null);

            let selectionManager = this.selectionManager;
            let allowInteractions = this.host.allowInteractions;

            // This must be an anonymous function instead of a lambda because
            // d3 uses 'this' as the reference to the element that was clicked.
            bars.on('click', function (d) {
                // Allow selection only if the visual is rendered in a view that supports interactivity (e.g. Report)
                if (allowInteractions) {
                    selectionManager.select(d.selectionId).then((ids: ISelectionId[]) => {
                        bars.attr({
                            'fill-opacity': ids.length > 0 ? Visual.Config.transparentOpacity : Visual.Config.solidOpacity
                        });

                        d3.select(this).attr({
                            'fill-opacity': Visual.Config.solidOpacity
                        });
                    });

                    (<Event>d3.event).stopPropagation();
                }
            });

            bars.exit()
                .remove();

            // this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
            // console.log('Visual update', options);
            // if (typeof this.textNode !== "undefined") {
            //     this.textNode.textContent = (this.updateCount++).toString();
            // }
        }


        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {
                case 'enableAxis':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            show: this.barChartSettings.enableAxis.show,
                        },
                        selector: null
                    });
                    break;
                case 'colorSelector':
                    for (let barDataPoint of this.barDataPoints) {
                        objectEnumeration.push({
                            objectName: objectName,
                            displayName: barDataPoint.category,
                            properties: {
                                fill: {
                                    solid: {
                                        color: barDataPoint.color
                                    }
                                }
                            },
                            selector: barDataPoint.selectionId.getSelector()
                        });
                    }
                    break;
                case 'generalView':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            opacity: this.barChartSettings.generalView.opacity,
                            showHelpLink: this.barChartSettings.generalView.showHelpLink
                        },
                        validValues: {
                            opacity: {
                                numberRange: {
                                    min: 10,
                                    max: 100
                                }
                            }
                        },
                        selector: null
                    });
                    break;
            };

            return objectEnumeration;
        }

        public destroy(): void {
            // Perform any cleanup tasks here
        }

    }
}
