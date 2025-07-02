import { DEFAULT_PAGE } from '@/constants';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

export const useAgentsFilters = () => {
  return useQueryStates({
    // .withDefault('').withOptions({ clearOnDefault: true }) means that if the value is empty, it will clear the search param from the URL
    search: parseAsString.withDefault('').withOptions({ clearOnDefault: true }),
    page: parseAsInteger
      .withDefault(DEFAULT_PAGE)
      .withOptions({ clearOnDefault: true }),
  });
};

// we are going to add PAGE_SIZE why? because nuqs away to syncronize
// your search params with your useState,
//example: localhost:3000/agents?search=hello
// so we can use nuqs to synchronize our search params with our useState in react components
// i need to user can not append page size to the url
