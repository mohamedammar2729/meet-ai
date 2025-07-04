import { Button } from "@/components/ui/button";
import { DEFAULT_PAGE } from "@/constants";

interface Props {
  Page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const DataPagination = ({ Page, totalPages, onPageChange }: Props) => {


  return (
    <div className='flex items-center justify-between'>
      <div className='flex-1 text-sm text-muted-foreground'>
        Page {Page} of {totalPages || DEFAULT_PAGE}
      </div>
      <div className='flex items-center justify-end space-x-2 py-4 '>
        <Button
          disabled={Page === DEFAULT_PAGE}
          onClick={() => onPageChange(Math.max(DEFAULT_PAGE, Page - 1))}
          variant='outline'
          size='sm'
        >
          Previous
        </Button>
        <Button
          disabled={Page === totalPages || totalPages === 0}
          onClick={() => onPageChange(Math.min(totalPages, Page + 1))}
          variant='outline'
          size='sm'
        >
          Next
        </Button>
      </div>
    </div>
  );
};
