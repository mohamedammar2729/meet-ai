'use client';

import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { authClient } from '@/lib/auth-client';
import { PricingCard } from '../components/pricing-card';


export const UpgradeViewLoading = () => {
  return (
    <LoadingState
      title='Loading'
      description='This is may take a few seconds'
    />
  );
};

export const UpgradeViewError = () => {
  return <ErrorState title='Error' description='Please try again later.' />;
};

export const UpgradeView = () => {
  const trpc = useTRPC();
  // we used useSuspenseQuery instead of useQuery it get prefetched data from the server
  const { data: products } = useSuspenseQuery(
    trpc.premium.getProducts.queryOptions()
  );
  const { data: currentSubscription } = useSuspenseQuery(
    trpc.premium.getCurrentSubscription.queryOptions()
  );

  return (
    <div className='flex-1 px-4 py-4 md:px-8 flex flex-col gap-y-10'>
      <div className='mt-1 flex-1 flex flex-col gap-y-10 items-center '>
        <h5 className='text-2xl md:text-3xl font-medium '>
          You are on the{' '}
          <span className='text-primary font-semibold'>
            {currentSubscription?.name ?? 'Free'}
          </span>{' '}
          Plan
        </h5>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {products.map((product) => {
            const isCurrebtProduct = currentSubscription?.id === product.id;
            const isPremium = !!currentSubscription;
            let buttonText = 'Upgrade';
            let onClick = () => authClient.checkout({ products: [product.id] });

            if (isCurrebtProduct) {
              buttonText = 'Mangae';
              onClick = () => authClient.customer.portal();
            } else if (isPremium) {
              buttonText = 'Change Plan';
              onClick = () => authClient.customer.portal();
            }
            return (
              <PricingCard
                key={product.id}
                title={product.name}
                price={
                  product.prices[0].amountType === 'fixed'
                    ? product.prices[0].priceAmount / 100
                    : 0
                }
                description={product.description}
                priceSuffix={`/ ${product.prices[0].recurringInterval}`}
                features={product.benefits.map(
                  (benefit) => benefit.description
                )}
                badge={product.metadata.badge as string | null}
                buttonText={buttonText}
                onClick={onClick}
                variant={
                  product.metadata.varient === 'highlighted'
                    ? 'highlighted'
                    : 'default'
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
