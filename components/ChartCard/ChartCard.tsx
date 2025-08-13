import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-gifted-charts';

const theme = {
  toDoColor: '#FF6B6B',
  progressColor: '#4ECDC4',
  completedColor: '#45B7D1',
  frameBackground: '#FFFFFF',
  textPrimary: '#000000',
  textSecondary: '#666666',
};

type PieChartProps = {
  data?: {
    todoTaskCount: number;
    progressTaskCount: number;
    completeTaskCount: number;
  };
};

const PieChart = ({ data }: PieChartProps) => {
  const { width } = Dimensions.get('window');
  const isLargeScreen = width > 1024;

  if (!data) {
    return null;
  }

  const pieData = [
    { value: data?.todoTaskCount ?? 0, color: theme.toDoColor },
    { value: data?.progressTaskCount ?? 0, color: theme.progressColor },
    { value: data?.completeTaskCount ?? 0, color: theme.completedColor, focused: true },
  ];

  const totalTasks =
    (data?.todoTaskCount ?? 0) +
    (data?.progressTaskCount ?? 0) +
    (data?.completeTaskCount ?? 0);

  if (totalTasks === 0) {
    return null;
  }

  const todoPercentage = (((data?.todoTaskCount ?? 0) / totalTasks) * 100).toFixed(0);
  const progressPercentage = (((data?.progressTaskCount ?? 0) / totalTasks) * 100).toFixed(0);
  const completePercentage = (((data?.completeTaskCount ?? 0) / totalTasks) * 100).toFixed(0);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.leftContainer}>
          <Text style={styles.secondaryText}>Project Progress</Text>
          <View style={styles.labelsContainer}>
            <PieLabelRow label="To-Do" percentage={todoPercentage} color={theme.toDoColor} />
            <PieLabelRow label="In Progress" percentage={progressPercentage} color={theme.progressColor} />
            <PieLabelRow label="Complete" percentage={completePercentage} color={theme.completedColor} />
          </View>
        </View>
        <View style={styles.separator} />
        <View style={[styles.rightContainer, isLargeScreen && styles.rightContainerLarge]}>
          <RNPieChart
            data={pieData}
            donut
            sectionAutoFocus
            radius={isLargeScreen ? 55 : 60}
            innerRadius={isLargeScreen ? 35 : 40}
            innerCircleColor={theme.frameBackground}
            centerLabelComponent={() =>
              !isLargeScreen ? (
                <View style={styles.centerLabel}>
                  <Text style={styles.centerPercentage}>{completePercentage}%</Text>
                  <Text style={styles.centerText}>Complete</Text>
                </View>
              ) : null
            }
          />
          {isLargeScreen && (
            <View style={styles.largeScreenLabel}>
              <Text style={styles.largePercentage}>{completePercentage}%</Text>
              <Text style={styles.largeText}>Complete</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const PieLabelRow = ({ label, percentage, color }: { label: string; percentage: string; color: string }) => {
  return (
    <View style={styles.labelRow}>
      <View style={styles.labelContent}>
        <View style={[styles.colorDot, { backgroundColor: color }]} />
        <Text style={styles.labelText}>{label}:</Text>
      </View>
      <Text style={styles.percentageText}>{percentage}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.frameBackground,
    borderRadius: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  leftContainer: {
    width: '50%',
    padding: 20,
  },
  secondaryText: {
    color: theme.textSecondary,
    fontSize: 16,
    marginBottom: 20,
  },
  labelsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  separator: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  rightContainer: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 16,
  },
  rightContainerLarge: {
    justifyContent: 'flex-start',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPercentage: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  centerText: {
    fontSize: 14,
    color: theme.textPrimary,
  },
  largeScreenLabel: {
    justifyContent: 'center',
  },
  largePercentage: {
    fontSize: 35,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  largeText: {
    fontSize: 18,
    color: theme.textPrimary,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  labelText: {
    fontSize: 16,
    color: theme.textPrimary,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textPrimary,
    lineHeight: 18,
  },
});

export default PieChart;