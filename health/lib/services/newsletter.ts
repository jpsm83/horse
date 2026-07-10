import connectDb from "@/app/api/db/connectDb";
import Subscriber from "@/app/api/models/subscriber";

export interface SubscriberForNewsletter {
  email: string;
  unsubscribeToken: string;
}

export async function getSubscribersForNewsletterService(): Promise<SubscriberForNewsletter[]> {
  await connectDb();

  const subscribers = await Subscriber.find()
    .select('email unsubscribeToken')
    .lean();

  return subscribers.map((sub) => ({
    email: sub.email,
    unsubscribeToken: sub.unsubscribeToken,
  }));
}

