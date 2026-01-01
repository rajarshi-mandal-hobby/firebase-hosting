import { Group, Table, Text } from "@mantine/core";
import { formatDate } from "../utils";

import {
   IconBed,
   IconCalendarMonth,
   IconCall,
   IconPayments,
   IconRupee,
   IconUniversalCurrency,
   IconWifi,
   IconFirebase
} from "../icons";
import type { Member } from "../../data/types";

const ICON_SIZE = 14;

type TableRowProps = {
   heading: string;
   value: any;
   icon: React.ElementType;
};

const TableRow = ({ heading, value, icon: Icon }: TableRowProps) => (
   <Table.Tr>
      <Table.Th pl={0} fw={500} w={155}>
         <Group wrap='nowrap' gap='xs'>
            <Icon size={ICON_SIZE} />
            {heading}
         </Group>
      </Table.Th>
      <Table.Td pr={0}>
         <Text lineClamp={1}>{value}</Text>
      </Table.Td>
   </Table.Tr>
);

type MemberDetailsListProps = {
   member: Member;
   isAdmin?: boolean;
};

export const MemberDetailsList = ({ member, isAdmin = false }: MemberDetailsListProps) => (
   <Table layout='fixed' verticalSpacing='sm' fz='sm'>
      <Table.Tbody>
         <TableRow heading='Phone' value={member.phone} icon={IconCall} />
         <TableRow heading='Move-in Date' value={formatDate(member.moveInDate)} icon={IconCalendarMonth} />
         <TableRow heading='Floor & Bed' value={`${member.floor} - ${member.bedType}`} icon={IconBed} />
         <TableRow heading='Current Rent' value={"₹" + member.currentRent + "/month"} icon={IconRupee} />
         <TableRow
            heading='Rent at Joining'
            value={"₹" + member.rentAtJoining + "/month"}
            icon={IconUniversalCurrency}
         />
         <TableRow heading='Advance Deposit' value={"₹" + member.advanceDeposit} icon={IconUniversalCurrency} />
         <TableRow heading='Security Deposit' value={"₹" + member.securityDeposit} icon={IconUniversalCurrency} />
         <TableRow heading='Total Agreed Deposit' value={"₹" + member.totalAgreedDeposit} icon={IconPayments} />
         <TableRow heading='WiFi' value={member.optedForWifi ? "Opted In" : "Not Opted"} icon={IconWifi} />
         {/* Admin-only fields */}
         {isAdmin && member.leaveDate && (
            <TableRow heading='Leave Date' value={formatDate(member.leaveDate)} icon={IconFirebase} />
         )}
         {isAdmin && member.ttlExpiry && (
            <TableRow heading='TTL Expiry' value={formatDate(member.ttlExpiry)} icon={IconFirebase} />
         )}
         {isAdmin && member.firebaseUid && (
            <TableRow heading='Firebase UID' value={member.firebaseUid} icon={IconFirebase} />
         )}
         {isAdmin && member.fcmToken && <TableRow heading='FCM Token' value={member.fcmToken} icon={IconFirebase} />}
      </Table.Tbody>
   </Table>
);
