import {ExpressAdapter} from '@bull-board/express'
import { createBullBoard } from '@bull-board/api'
import {BullMQAdapter}  from '@bull-board/api/bullMQAdapter'
import { cartQueue } from './queues/cart.queue.js'
import { orderEmailQueue } from './queues/order-email.queue.js'
import { reportQueue } from './queues/report.queue.js'
import { emailQueues } from './queues/email.queues.js'


const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
    queues:[
        new BullMQAdapter(cartQueue),
        new BullMQAdapter(orderEmailQueue),
        new BullMQAdapter(reportQueue),
        new BullMQAdapter(emailQueues)
    ],serverAdapter
})

export {serverAdapter}