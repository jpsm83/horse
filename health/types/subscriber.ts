export interface ISubscriptionPreferences {
  categories: string[];
  subscriptionFrequencies: string;
}

export interface IUpdateSubscriberPreferencesParams {
  subscriptionPreferences: ISubscriptionPreferences;
}

export interface ISerializedSubscriber {
  _id: string;
  email: string;
  emailVerified: boolean;
  unsubscribeToken: string;
  userId: string | null;
  subscriptionPreferences: {
    categories: string[];
    subscriptionFrequencies: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateSubscriberPreferencesResponse {
  success: boolean;
  data?: ISerializedSubscriber;
  message?: string;
  error?: string;
}

export interface IGetSubscriberByIdResponse {
  success: boolean;
  data?: ISerializedSubscriber;
  message?: string;
  error?: string;
}

export interface IGetSubscribersResponse {
  success: boolean;
  data?: ISerializedSubscriber[];
  message?: string;
  error?: string;
}
