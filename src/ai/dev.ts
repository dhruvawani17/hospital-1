
import { config } from 'dotenv';
config();

import '@/ai/flows/chatFlow'; // Updated to import the new chat flow
import '@/ai/flows/send-confirmation-email-flow'; // Import the new email flow
