import { GenerateBills } from '../generate-bills/GenerateBills';
import { FormPageHeader } from './shared-components/FormPageHeader';

export const GenerateBillsPage = () => <FormPageHeader title='Generate Bills' pageContent={<GenerateBills />} />;
