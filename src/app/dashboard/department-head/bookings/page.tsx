"use client";

import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Clock, Plus, Trash2, RotateCcw } from "lucide-react";
import { useDepartmentHeadStore } from "@/store/departmentHeadStore";
import { Table, Button, Spin, Modal, Form, DatePicker, Select, Tag, message, ConfigProvider, theme } from "antd";
import dayjs from "dayjs";

export default function DepartmentBookingsPage() {
  const {
    bookableResources,
    resourceBookings,
    isLoading,
    fetchBookableResources,
    fetchResourceBookings,
    createBooking,
    cancelBooking,
  } = useDepartmentHeadStore();

  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  useEffect(() => {
    fetchBookableResources();
  }, [fetchBookableResources]);

  useEffect(() => {
    if (selectedResourceId) {
      fetchResourceBookings(selectedResourceId);
    }
  }, [selectedResourceId, fetchResourceBookings]);

  const handleSelectResource = (value: string) => {
    setSelectedResourceId(value);
  };

  const handleBookSubmit = async (values: any) => {
    if (!selectedResourceId) return;
    setBookingError(null);
    setIsSubmitLoading(true);

    const startTime = values.timeRange[0].toISOString();
    const endTime = values.timeRange[1].toISOString();

    const err = await createBooking(selectedResourceId, startTime, endTime);
    setIsSubmitLoading(false);

    if (err) {
      setBookingError(err);
    } else {
      message.success("Booking created successfully!");
      setIsBookModalOpen(false);
      form.resetFields();
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const success = await cancelBooking(bookingId, "Cancelled by Department Head");
    if (success) {
      message.success("Booking cancelled successfully");
      if (selectedResourceId) {
        fetchResourceBookings(selectedResourceId);
      }
    } else {
      message.error("Failed to cancel booking");
    }
  };

  const columns = [
    {
      title: "Booked By",
      dataIndex: "bookedByEmployeeName",
      key: "bookedByEmployeeName",
      className: "whitespace-normal break-words leading-tight text-white",
      render: (text: string) => text ? `👤 ${text}` : "🏢 Department Pool",
    },
    {
      title: "Start Time",
      dataIndex: "startTime",
      key: "startTime",
      className: "whitespace-normal break-words leading-tight text-white",
      render: (text: string) => dayjs(text).format("MMM DD, YYYY · hh:mm A"),
    },
    {
      title: "End Time",
      dataIndex: "endTime",
      key: "endTime",
      className: "whitespace-normal break-words leading-tight text-white",
      render: (text: string) => dayjs(text).format("MMM DD, YYYY · hh:mm A"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text: string) => (
        <Tag color={text === "upcoming" ? "blue" : text === "ongoing" ? "green" : "default"} className="capitalize">
          {text}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => {
        const isUpcoming = record.status === "upcoming";
        return isUpcoming ? (
          <Button
            danger
            type="text"
            icon={<Trash2 className="w-3.5 h-3.5 mr-1" />}
            onClick={() => handleCancelBooking(record.id)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center"
          >
            Cancel
          </Button>
        ) : null;
      },
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#10b981", // emerald-500
          colorBgContainer: "#111827", // gray-900
          colorBorder: "#1f2937", // gray-800
        },
      }}
    >
      <div className="space-y-6 max-w-7xl text-white">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-emerald-400" />
              Shared Resource Bookings
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Reserve shared rooms, equipment, or vehicles on behalf of your department.
            </p>
          </div>
          <div className="flex gap-2">
            {selectedResourceId && (
              <Button
                onClick={() => fetchResourceBookings(selectedResourceId)}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                className="bg-gray-800 text-gray-300 hover:text-white border-gray-700 w-fit rounded-xl"
              >
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Selection bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-gray-900 border border-gray-800 p-4 rounded-2xl">
          <div className="flex-1">
            <label className="block text-gray-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Select Shared Resource</label>
            <Select
              showSearch
              placeholder="Select a bookable resource..."
              onChange={handleSelectResource}
              value={selectedResourceId}
              className="w-full bg-gray-800 border-gray-700 rounded-xl"
              style={{ height: "40px" }}
              optionFilterProp="label"
              options={bookableResources.map((res) => ({
                label: `${res.name} (${res.assetTag}) — ${res.location || "No Location"}`,
                value: res.id,
              }))}
            />
          </div>
          {selectedResourceId && (
            <div className="flex items-end shrink-0 pt-5 sm:pt-0">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4 mr-1" />}
                onClick={() => setIsBookModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 border-none rounded-xl h-10 flex items-center px-5"
              >
                Book Time Slot
              </Button>
            </div>
          )}
        </div>

        {/* Bookings View */}
        {selectedResourceId ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Existing Bookings Schedule</h2>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Spin />
              </div>
            ) : (
              <Table
                dataSource={resourceBookings}
                columns={columns}
                rowKey="id"
                pagination={{
                  pageSize: 5,
                  showSizeChanger: false,
                }}
                className="custom-table"
                locale={{ emptyText: "No active bookings for this resource." }}
              />
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/30 p-12 text-center">
            <CalendarIcon className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Select a shared resource above to view its bookings and schedule a reservation.</p>
          </div>
        )}

        {/* Booking Reservation Modal */}
        <Modal
          title="Reserve Time Slot"
          open={isBookModalOpen}
          onCancel={() => {
            setIsBookModalOpen(false);
            setBookingError(null);
            form.resetFields();
          }}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleBookSubmit}
            className="py-4 space-y-4"
          >
            {bookingError && (
              <div className="p-3 bg-red-500/15 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {bookingError}
              </div>
            )}
            <Form.Item
              name="timeRange"
              label={<span className="text-gray-300">Booking Time Slot</span>}
              rules={[{ required: true, message: "Please select a start and end time" }]}
            >
              <DatePicker.RangePicker
                showTime={{ format: "HH:mm" }}
                format="YYYY-MM-DD HH:mm"
                className="w-full bg-gray-900 border-gray-800 text-white rounded-xl py-2"
                placeholder={["Start Time", "End Time"]}
                disabledDate={(current) => current && current < dayjs().startOf("day")}
              />
            </Form.Item>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => {
                  setIsBookModalOpen(false);
                  form.resetFields();
                }}
                className="rounded-xl bg-gray-800 border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitLoading}
                className="bg-emerald-600 hover:bg-emerald-500 border-none rounded-xl"
              >
                Book Resource
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
}
