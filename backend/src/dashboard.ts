import {ExpressAdapter} from '@bull-board/express'
import { createBullBoard } from '@bull-board/api'
import {BullMQAdapter}  from '@bull-board/api/bullMQAdapter'
import { cartQueue } from './queues/cart.queue.js'


const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
    queues:[
        new BullMQAdapter(cartQueue)
    ],serverAdapter
})

export {serverAdapter}