import client from 'prom-client'


const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics()

export const httpRequestCounter = new client.Counter({
    name:"http_request_total",
    help:"Total number of HTTP requests",
    labelNames:["method","route","status"]
})

export const httpRequestDuration = new client.Histogram({
    name:"http_request_duration_seconds",
    help:"Duration of HTTP request in seconds",
    labelNames:["method","route","status"],
    buckets:[0.1,0.3,0.5,1,1.5,2.5]
})

export const register = client.register