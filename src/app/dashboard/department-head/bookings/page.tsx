"use client";

import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Clock, Plus, Trash2, RotateCcw } from "lucide-react";
import { useDepartmentHeadStore } from "@/store/departmentHeadStore";
import { Table, Button, Spin, Modal, Form, DatePicker, Select, Tag, message } from "antd";
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
      className: "whitespace-normal break-words leading-tight text-gray-100 font-bold",
      render: (text: string) => text ? `👤 ${text}` : "🏢 Department Pool",
    },
    {
      title: "Start Time",
      dataIndex: "startTime",
      key: "startTime",
      className: "whitespace-normal break-words leading-tight text-gray-200 font-medium",
      render: (text: string) => dayjs(text).format("MMM DD, YYYY · hh:mm A"),
    },
    {
      title: "End Time",
      dataIndex: "endTime",
      key: "endTime",
      className: "whitespace-normal break-words leading-tight text-gray-200 font-medium",
      render: (text: string) => dayjs(text).format("MMM DD, YYYY · hh:mm A"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text: string) => (
        <Tag color={text === "upcoming" ? "blue" : text === "ongoing" ? "green" : "default"} className="capitalize font-semibold">
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
            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center font-semibold border-none"
          >
            Cancel
          </Button>
        ) : null;
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-500" />
            Shared Resource Bookings
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Reserve shared rooms, equipment, or vehicles on behalf of your department.
          </p>
        </div>
        <div className="flex gap-2">
          {selectedResourceId && (
            <button
              type="button"
              onClick={() => fetchResourceBookings(selectedResourceId)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-none text-sm font-semibold transition-all disabled:opacity-50 !bg-gray-800/80 !text-gray-200 hover:!bg-gray-700/80 cursor-pointer"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Selection bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-gray-900 border border-gray-800 p-5 rounded-2xl">
        <div className="flex-1">
          <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Select Shared Resource</label>
          <Select
            showSearch
            placeholder="Select a bookable resource..."
            onChange={handleSelectResource}
            value={selectedResourceId}
            className="w-full rounded-xl"
            style={{ width: "100%" }}
            size="large"
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
              className="bg-emerald-600 hover:bg-emerald-500 border-none rounded-xl h-10 flex items-center px-5 text-white"
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
            <Clock className="w-4 h-4 text-emerald-500" />
            <h2 className="text-lg font-bold text-gray-100">Existing Bookings Schedule</h2>
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
                showSizeChanger: true,
              }}
              className="overflow-hidden"
              locale={{ emptyText: "No active bookings for this resource." }}
            />
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/30 p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">Select a shared resource above to view its bookings and schedule a reservation.</p>
        </div>
      )}

      {/* Booking Reservation Modal */}
      <Modal
        title={<span className="text-gray-100 font-bold">Reserve Time Slot</span>}
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
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
              {bookingError}
            </div>
          )}
          <Form.Item
            name="timeRange"
            label={<span className="text-gray-600 font-bold">Booking Time Slot</span>}
            rules={[{ required: true, message: "Please select a start and end time" }]}
          >
            <DatePicker.RangePicker
              showTime={{ format: "HH:mm" }}
              format="YYYY-MM-DD HH:mm"
              className="w-full rounded-xl py-2"
              style={{ width: "100%" }}
              size="large"
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
              className="rounded-xl bg-gray-800 border-gray-700 text-gray-300 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitLoading}
              className="bg-emerald-600 hover:bg-emerald-500 border-none rounded-xl text-white font-semibold"
            >
              Book Resource
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
