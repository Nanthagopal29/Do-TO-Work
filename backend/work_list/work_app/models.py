from django.db import models

class user_master(models.Model):
    id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=10, unique=True)
    user_name = models.CharField(max_length=100)
    user_role = models.CharField(max_length=100)
    user_status = models.BooleanField(default=True)
    cost_per_hour = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user_name


class project_master(models.Model):
    id = models.AutoField(primary_key=True)
    project_name = models.CharField(max_length=100)
    project_description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.project_name

class category_master(models.Model):
    id = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.category_name

class subcategory_master(models.Model):
    id = models.AutoField(primary_key=True)
    category = models.ForeignKey(category_master, on_delete=models.CASCADE)
    subcategory_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.subcategory_name

class task_master(models.Model):
    id = models.AutoField(primary_key=True)
    project = models.ForeignKey(project_master, on_delete=models.CASCADE, null=True, blank=True) # Connects task to a project
    code = models.ForeignKey(user_master, on_delete=models.CASCADE, null=True, blank=True)
    task_name = models.CharField(max_length=100)
    assing_date = models.DateTimeField(auto_now_add=True)
    task_description = models.TextField(null=True, blank=True)
    task_start_date = models.DateTimeField(null=True, blank=True)
    task_end_date = models.DateTimeField(null=True, blank=True)
    task_status = models.CharField(max_length=50, default="Pending") # Changed to CharField for "Pending", "Completed", etc.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.task_name



class TrsWorkentry(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True)  # Field name made lowercase.
    username = models.CharField(db_column='UserName', max_length=100, db_collation='Latin1_General_CI_AI')  # Field name made lowercase.
    entrydate = models.DateField(db_column='EntryDate')  # Field name made lowercase.
    project = models.CharField(db_column='Project', max_length=100, db_collation='Latin1_General_CI_AI', blank=True, null=True)  # Field name made lowercase.
    category = models.CharField(db_column='Category', max_length=100, db_collation='Latin1_General_CI_AI', blank=True, null=True)  # Field name made lowercase.
    subcat = models.CharField(db_column='SubCat', max_length=100, db_collation='Latin1_General_CI_AI', blank=True, null=True)  # Field name made lowercase.
    startdatetime = models.DateTimeField(db_column='StartDateTime', blank=True, null=True)  # Field name made lowercase.
    startstatus = models.CharField(db_column='StartStatus', max_length=20, db_collation='Latin1_General_CI_AI', blank=True, null=True)  # Field name made lowercase.
    description = models.TextField(db_column='Description', db_collation='Latin1_General_CI_AI', blank=True, null=True)  # Field name made lowercase.
    enddatetime = models.DateTimeField(db_column='EndDateTime', blank=True, null=True)  # Field name made lowercase.
    endstatus = models.CharField(db_column='EndStatus', max_length=20, db_collation='Latin1_General_CI_AI', blank=True, null=True)  # Field name made lowercase.
    duration = models.CharField(db_column='Duration', max_length=50, db_collation='Latin1_General_CI_AI', blank=True, null=True)  # Field name made lowercase.
    createddate = models.DateTimeField(db_column='CreatedDate', blank=True, null=True)  # Field name made lowercase.
    modifieddate = models.DateTimeField(db_column='ModifiedDate', blank=True, null=True)  # Field name made lowercase.
    durationminutes = models.IntegerField(db_column='DurationMinutes', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Trs_Workentry'


class workentry_pause(models.Model):
    id = models.AutoField(primary_key=True)
    workentry = models.ForeignKey(TrsWorkentry, on_delete=models.CASCADE)
    pause_start_time = models.DateTimeField()
    pause_end_time = models.DateTimeField(blank=True, null=True)
    pause_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Pause for {self.workentry.username} on {self.workentry.entrydate}"