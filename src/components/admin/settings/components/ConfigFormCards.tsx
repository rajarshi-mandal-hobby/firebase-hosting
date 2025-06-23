import React from "react";
import { Stack, Card, Text, SimpleGrid } from "@mantine/core";
import ConfigNumberInput from "./ConfigNumberInput";
import type { ConfigFormData } from "../hooks/useConfigForm";

interface ConfigFormCardsProps {
  configForm: {
    values: ConfigFormData;
    setFieldValue: (path: string, value: string | number) => void;
  };
  editMode: boolean;
  showValidationErrors: boolean;
  getFieldError: (fieldPath: string) => string | undefined;
  isFieldUnset: (
    value: string | number | undefined,
    allowZero?: boolean,
  ) => boolean;
  handleBedValueChange: (floor: string, value: string | number) => void;
  handleNumericValue: (value: string | number) => string | number;
  clearErrorsOnChange: (fieldPath: string) => void;
}

export const ConfigFormCards: React.FC<ConfigFormCardsProps> = ({
  configForm,
  editMode,
  showValidationErrors,
  getFieldError,
  isFieldUnset,
  handleBedValueChange,
  handleNumericValue,
  clearErrorsOnChange,
}) => {
  const handleRoomAutoFill = (floor: string) => {
    const bedValue = configForm.values.bedTypes[floor]?.["Bed"];
    if (bedValue && bedValue !== "") {
      const numValue =
        typeof bedValue === "number"
          ? bedValue
          : parseFloat(bedValue.toString());
      if (!isNaN(numValue) && numValue > 0) {
        configForm.setFieldValue(`bedTypes.${floor}.Room`, numValue * 2);
      }
    }
  };

  return (
    <Stack gap="md">
      {/* 2nd Floor Card */}
      <Card withBorder p="md">
        <Text fw={500} mb="md">
          2nd Floor
        </Text>
        <Stack gap="sm">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
            <ConfigNumberInput
              label="Bed"
              description="Monthly rate for bed accommodation"
              value={configForm.values.bedTypes["2nd"]?.["Bed"] || ""}
              onChange={(value) => handleBedValueChange("2nd", value)}
              onBlur={() => handleRoomAutoFill("2nd")}
              disabled={!editMode}
              fieldPath="bedTypes.2nd.Bed"
              placeholder="Enter amount (minimum 1000)"
              getFieldError={getFieldError}
              isFieldUnset={isFieldUnset}
              showValidationErrors={showValidationErrors}
            />
            <ConfigNumberInput
              label="Room"
              description="Monthly rate for private room (auto-filled)"
              value={configForm.values.bedTypes["2nd"]?.["Room"] || ""}
              onChange={(value: string | number) => {
                configForm.setFieldValue(
                  `bedTypes.2nd.Room`,
                  handleNumericValue(value),
                );
                clearErrorsOnChange("bedTypes.2nd.Room");
              }}
              disabled={!editMode}
              fieldPath="bedTypes.2nd.Room"
              placeholder="Enter amount (minimum 1000)"
              getFieldError={getFieldError}
              isFieldUnset={isFieldUnset}
              showValidationErrors={showValidationErrors}
            />
            <ConfigNumberInput
              label="Special Room"
              description="Monthly rate for premium accommodation"
              value={configForm.values.bedTypes["2nd"]?.["Special Room"] || ""}
              onChange={(value: string | number) => {
                configForm.setFieldValue(
                  `bedTypes.2nd.Special Room`,
                  handleNumericValue(value),
                );
                clearErrorsOnChange("bedTypes.2nd.Special Room");
              }}
              disabled={!editMode}
              fieldPath="bedTypes.2nd.Special Room"
              placeholder="Enter amount (minimum 1000)"
              getFieldError={getFieldError}
              isFieldUnset={isFieldUnset}
              showValidationErrors={showValidationErrors}
            />
          </SimpleGrid>
        </Stack>
      </Card>

      {/* 3rd Floor Card */}
      <Card withBorder p="md">
        <Text fw={500} mb="md">
          3rd Floor
        </Text>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
          <ConfigNumberInput
            label="Bed"
            description="Monthly rate for bed accommodation"
            value={configForm.values.bedTypes["3rd"]?.["Bed"] || ""}
            onChange={(value) => handleBedValueChange("3rd", value)}
            onBlur={() => handleRoomAutoFill("3rd")}
            disabled={!editMode}
            fieldPath="bedTypes.3rd.Bed"
            placeholder="Enter amount (minimum 1000)"
            getFieldError={getFieldError}
            isFieldUnset={isFieldUnset}
            showValidationErrors={showValidationErrors}
          />
          <ConfigNumberInput
            label="Room"
            description="Monthly rate for private room (auto-filled)"
            value={configForm.values.bedTypes["3rd"]?.["Room"] || ""}
            onChange={(value: string | number) => {
              configForm.setFieldValue(
                `bedTypes.3rd.Room`,
                handleNumericValue(value),
              );
              clearErrorsOnChange("bedTypes.3rd.Room");
            }}
            disabled={!editMode}
            fieldPath="bedTypes.3rd.Room"
            placeholder="Enter amount (minimum 1000)"
            getFieldError={getFieldError}
            isFieldUnset={isFieldUnset}
            showValidationErrors={showValidationErrors}
          />
        </SimpleGrid>
      </Card>

      {/* Other Charges Card */}
      <Card withBorder p="md">
        <Text fw={500} mb="md">
          Other Charges
        </Text>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
          <ConfigNumberInput
            label="Security Deposit"
            description="One-time security deposit amount"
            value={configForm.values.defaultSecurityDeposit}
            onChange={(value: string | number) => {
              configForm.setFieldValue(
                "defaultSecurityDeposit",
                handleNumericValue(value),
              );
              clearErrorsOnChange("defaultSecurityDeposit");
            }}
            disabled={!editMode}
            fieldPath="defaultSecurityDeposit"
            placeholder="Enter amount (minimum 1000)"
            getFieldError={getFieldError}
            isFieldUnset={isFieldUnset}
            showValidationErrors={showValidationErrors}
          />
          <ConfigNumberInput
            label="Wi-Fi"
            description="Monthly Wi-Fi charges (can be 0)"
            value={configForm.values.wifiMonthlyCharge}
            onChange={(value: string | number) => {
              configForm.setFieldValue(
                "wifiMonthlyCharge",
                handleNumericValue(value),
              );
              clearErrorsOnChange("wifiMonthlyCharge");
            }}
            disabled={!editMode}
            fieldPath="wifiMonthlyCharge"
            placeholder="Enter amount (0 or more)"
            getFieldError={getFieldError}
            isFieldUnset={isFieldUnset}
            showValidationErrors={showValidationErrors}
            allowZero={true}
          />
        </SimpleGrid>
      </Card>
    </Stack>
  );
};
